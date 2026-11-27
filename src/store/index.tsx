import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarCfg, DayLog, Friend, Level, Rarity, RealReward, RunRecord, Settings, State, Workout } from '../types';
import { initialState } from './defaults';
import { ui } from './ui';
import { pick, timeKey } from '../data/messages';
import {
  ACHIEVEMENTS, attributes, ChestReward, TASKS, WHEEL, XP, bossOfMonth, dayOf, dayProgress, emptyDay, equippedValue, itemById, levelFromXp, metricOnMonth, metricOnWeek,
  multiplier, rollChest, SHIELD_PRICE, dailyMissions, weeklyMissions, missionProgress, DEFAULT_EQUIPPED,
} from '../data/game';
import { addDays, dateKey, diffDays, minutesOf, monthKey, uid, weekStart, hhmm } from '../utils/date';
import { config as audioCfg, haptic, play, initAudio, SoundName } from '../services/sound';
import { rescheduleAll } from '../services/notifications';

const KEY = 'rotinapro/state/v1';
type TaskId = keyof DayLog['tasks'];

const b64e = (s: string) => btoa(encodeURIComponent(s));
const b64d = (s: string) => decodeURIComponent(atob(s));

export const streakNow = (s: State, today = dateKey()) => {
  const l = s.streak.last;
  if (!l) return 0;
  const d = diffDays(today, l);
  if (d <= 1) return s.streak.current;
  if (d === 2 && s.shields > 0) return s.streak.current;
  return 0;
};

function mergeLoaded(base: State, saved: Partial<State>): State {
  return {
    ...base, ...saved, loaded: true,
    profile: { ...base.profile, ...saved.profile, avatar: { ...base.profile.avatar, ...saved.profile?.avatar } },
    settings: { ...base.settings, ...saved.settings, times: { ...base.settings.times, ...saved.settings?.times }, notifs: { ...base.settings.notifs, ...saved.settings?.notifs } },
    totals: { ...base.totals, ...saved.totals },
    streak: { ...base.streak, ...saved.streak },
    chestFlags: { ...base.chestFlags, ...saved.chestFlags },
    equipped: { ...DEFAULT_EQUIPPED, ...saved.equipped },
  };
}

export function useStoreInternal() {
  const [s, setS] = useState<State>(initialState());
  const ref = useRef<State>(s);
  const shotRun = useRef({ hit: 0, miss: 0 });

  const commit = useCallback((fn: (s: State) => State) => {
    ref.current = fn(ref.current);
    setS(ref.current);
  }, []);
  const patchDay = useCallback((k: string, fn: (d: DayLog) => DayLog) => {
    commit((st) => ({ ...st, days: { ...st.days, [k]: fn(st.days[k] ?? emptyDay()) } }));
  }, [commit]);

  const actions = useMemo(() => {
    const A = {
      msg: (key: string, vars?: Record<string, string | number>) => {
        const st = ref.current;
        return pick(key, st.settings.personality, st.settings.funny, { nome: st.profile.name || 'Júlio', ...(vars ?? {}) });
      },
      say: (key: string, vars?: Record<string, string | number>) => { const m = A.msg(key, vars); ui.bubble(m); return m; },

      /** Mensagem principal do topo da tela Hoje (prioriza situação > data > horário) */
      greeting: (): { key: string; text: string } => {
        const st = ref.current, now = new Date(), today = dateKey(now), h = now.getHours(), min = now.getMinutes();
        let key = timeKey(h);
        const [bd, bm] = (st.profile.birthday || '').split('/').map(Number);
        const daysAway = st.prevOpen ? diffDays(today, st.prevOpen) : 0;
        const yesterdayDone = !!st.days[addDays(today, -1)]?.done;
        const hasHistory = Object.keys(st.days).length > 0;
        if (bd && bm && now.getDate() === bd && now.getMonth() + 1 === bm) key = 'birthday';
        else if (daysAway >= 3) key = 'missed';
        else if (h * 60 + min >= minutesOf(st.settings.times.basket) + 15 && h < 17 && !dayOf(st, today).basketStarted && !dayOf(st, today).tasks.basket) key = 'basketLate';
        else if (hasHistory && !yesterdayDone && daysAway >= 1 && h < 18) key = 'skipped';
        else if (now.getDay() === 5 && h >= 8 && h < 18) key = 'friday';
        else if (now.getDay() === 0 && h >= 8 && h < 18) key = 'sunday';
        return { key, text: A.msg(key) };
      },

      // ---------- XP / moedas ----------
      award: (baseXp: number, label?: string, coins?: number) => {
        const st = ref.current, today = dateKey();
        const mult = multiplier(streakNow(st, today));
        const xp = Math.round(baseXp * mult);
        const gain = coins ?? Math.round(baseXp * 0.6);
        const before = levelFromXp(st.xp).level;
        const after = levelFromXp(st.xp + xp).level;
        const bonus = after > before ? Array.from({ length: after - before }, (_, i) => (before + i + 1) * 10).reduce((a, b) => a + b, 0) : 0;
        commit((x) => ({ ...x, xp: x.xp + xp, coins: x.coins + gain + bonus, days: { ...x.days, [today]: { ...(x.days[today] ?? emptyDay()), xp: (x.days[today]?.xp ?? 0) + xp } } }));
        ui.float(`+${xp} XP${mult > 1 ? ` (x${mult})` : ''}  +${gain + bonus} 🪙${label ? '  ' + label : ''}`);
        play('xp'); setTimeout(() => play('coin'), 250); haptic.light();
        if (after > before) { ui.emit({ t: 'levelup', level: after }); }
        return xp;
      },
      addCoins: (n: number) => commit((x) => ({ ...x, coins: x.coins + n })),

      completeTask: (id: TaskId) => {
        const today = dateKey();
        if (dayOf(ref.current, today).tasks[id]) return false;
        patchDay(today, (d) => ({ ...d, tasks: { ...d.tasks, [id]: true } }));
        const t = TASKS.find((x) => x.id === id)!;
        A.award(t.xp, t.emoji);
        A.afterEvent();
        return true;
      },

      afterEvent: () => {
        const st = ref.current, today = dateKey();
        const day = dayOf(st, today), prog = dayProgress(st, today);
        if (prog.pct >= 0.5 && !day.done) {
          const y = addDays(today, -1), yy = addDays(today, -2);
          let { current, best, last } = st.streak, shields = st.shields;
          if (last === y) current += 1;
          else if (last === yy && shields > 0 && !st.days[y]?.done) { shields -= 1; current += 1; ui.bubble('🛡️ Seu escudo salvou a sequência de ontem!'); }
          else if (last !== today) current = 1;
          best = Math.max(best, current); last = today;
          commit((x) => ({ ...x, shields, streak: { current, best, last }, days: { ...x.days, [today]: { ...dayOf(x, today), done: true } } }));
          if ([3, 7, 14, 21, 30, 50, 100].includes(current)) setTimeout(() => A.say('streakHigh', { n: current }), 1200);
        }
        if (prog.pct >= 1 && st.chestFlags.special !== today) ui.bubble('🎁 Baú especial liberado! Complete tudo e abra na tela Hoje.');
        A.checkAchievements();
      },

      checkAchievements: () => {
        const st = ref.current;
        const unlocked = ACHIEVEMENTS.filter((a) => !st.achievements[a.id] && a.test(st));
        if (!unlocked.length) return;
        const now = dateKey();
        commit((x) => ({ ...x, achievements: { ...x.achievements, ...Object.fromEntries(unlocked.map((a) => [a.id, now])) }, coins: x.coins + unlocked.reduce((a, b) => a + b.coins, 0) }));
        unlocked.forEach((a, i) => setTimeout(() => { ui.bubble(`🏅 Conquista: ${a.name}  (+${a.coins} 🪙)`); play('success'); haptic.success(); }, 800 + i * 1800));
      },

      // ---------- Treinos ----------
      finishWorkout: (p: { minutes: number; reps: { push: number; squat: number; situp: number; other: number }; counts: boolean }) => {
        if (!p.counts) { ui.bubble('🧪 Modo teste: treino sem XP.'); return; }
        const today = dateKey();
        const total = p.reps.push + p.reps.squat + p.reps.situp + p.reps.other;
        patchDay(today, (d) => ({ ...d, workouts: d.workouts + 1, minutes: d.minutes + p.minutes, reps: { push: d.reps.push + p.reps.push, squat: d.reps.squat + p.reps.squat, situp: d.reps.situp + p.reps.situp, other: d.reps.other + p.reps.other } }));
        commit((x) => ({ ...x, totals: { ...x.totals, workouts: x.totals.workouts + 1, reps: x.totals.reps + total } }));
        const first = A.completeTask('workout');
        if (!first) ui.bubble('💪 Treino extra registrado! (o XP do dia já foi pego)');
        ui.celebrate(); haptic.success(); A.say('workoutDone');
        A.afterEvent();
      },
      finishRun: (laps: number[], totalMs: number, counts: boolean) => {
        if (!counts) { ui.bubble('🧪 Modo teste: corrida sem XP.'); return; }
        const st = ref.current, today = dateKey();
        const fastest = Math.min(...laps), avg = laps.reduce((a, b) => a + b, 0) / laps.length;
        const rec: RunRecord = { id: uid(), date: today, totalMs, laps, fastest, avg };
        const isRecord = st.runs.length > 0 && totalMs < Math.min(...st.runs.map((r) => r.totalMs));
        const lap3 = laps[2] ? laps[2] / 1000 : undefined;
        patchDay(today, (d) => ({ ...d, laps: d.laps + laps.length, lap3: lap3 && (!d.lap3 || lap3 < d.lap3) ? lap3 : d.lap3 }));
        commit((x) => ({
          ...x, runs: [...x.runs, rec].slice(-200),
          totals: { ...x.totals, runs: x.totals.runs + 1, laps: x.totals.laps + laps.length, bestRunMs: x.totals.bestRunMs ? Math.min(x.totals.bestRunMs, totalMs) : totalMs, bestLapMs: x.totals.bestLapMs ? Math.min(x.totals.bestLapMs, fastest) : fastest },
        }));
        const first = A.completeTask('run');
        if (!first) A.award(20, '🏃 corrida extra');
        if (isRecord) { A.award(30, '⚡ recorde!'); setTimeout(() => A.say('record'), 900); }
        ui.celebrate(); haptic.success();
        A.afterEvent();
      },
      basketStarted: (startedAt: number) => {
        const st = ref.current, today = dateKey(new Date(startedAt));
        patchDay(today, (d) => ({ ...d, basketStarted: true }));
        const t = new Date(startedAt), planned = hhmm(st.settings.times.basket);
        const diff = t.getHours() * 60 + t.getMinutes() - (planned.h * 60 + planned.m);
        if (diff >= 0 && diff <= 2) {
          const days = [...new Set([...st.basketStartTimes, today])].sort().slice(-40);
          let c = 0, k = today;
          while (days.includes(k)) { c++; k = addDays(k, -1); }
          commit((x) => ({ ...x, basketStartTimes: days, punctualStreak: c }));
        }
        rescheduleAll(ref.current, true);
      },
      finishBasket: (minutes: number, counts: boolean) => {
        if (!counts) { ui.bubble('🧪 Modo teste: treino sem XP.'); return; }
        const today = dateKey();
        patchDay(today, (d) => ({ ...d, minutes: d.minutes + minutes }));
        commit((x) => ({ ...x, totals: { ...x.totals, basket: x.totals.basket + 1, basketMin: x.totals.basketMin + minutes } }));
        A.completeTask('basket');
        ui.celebrate(); haptic.success(); A.say('workoutDone');
        A.afterEvent();
      },
      logShot: (type: 'ft' | 'mid' | 'three', made: boolean) => {
        const today = dateKey();
        patchDay(today, (d) => {
          const cur = d.shots[type];
          return { ...d, shots: { ...d.shots, [type]: [cur[0] + (made ? 1 : 0), cur[1] + 1] as [number, number] } };
        });
        commit((x) => ({ ...x, totals: { ...x.totals, shotsMade: x.totals.shotsMade + (made ? 1 : 0), shotsAtt: x.totals.shotsAtt + 1, ft: x.totals.ft + (made && type === 'ft' ? 1 : 0) } }));
        const r = shotRun.current;
        if (made) { r.hit++; r.miss = 0; } else { r.miss++; r.hit = 0; }
        made ? haptic.light() : haptic.warn();
        if (r.hit === 5 || (r.hit > 5 && r.hit % 5 === 0)) A.say('shotsHot');
        if (r.miss === 4 || (r.miss > 4 && r.miss % 4 === 0)) A.say('shotsCold');
        A.checkAchievements();
      },
      undoShot: (type: 'ft' | 'mid' | 'three', made: boolean) => {
        const today = dateKey(), cur = dayOf(ref.current, today).shots[type];
        if (cur[1] === 0 || (made && cur[0] === 0)) return;
        patchDay(today, (d) => ({ ...d, shots: { ...d.shots, [type]: [d.shots[type][0] - (made ? 1 : 0), d.shots[type][1] - 1] as [number, number] } }));
        commit((x) => ({ ...x, totals: { ...x.totals, shotsMade: x.totals.shotsMade - (made ? 1 : 0), shotsAtt: x.totals.shotsAtt - 1, ft: x.totals.ft - (made && type === 'ft' ? 1 : 0) } }));
      },

      // ---------- Rotina ----------
      addWater: (delta: number) => {
        const today = dateKey(), st = ref.current, cur = dayOf(st, today).water;
        const next = Math.max(0, Math.min(30, cur + delta));
        if (next === cur) return;
        patchDay(today, (d) => ({ ...d, water: next }));
        delta > 0 ? (play('tick'), haptic.light()) : null;
        if (next >= st.settings.waterGoal && !dayOf(st, today).tasks.water) {
          commit((x) => ({ ...x, totals: { ...x.totals, water: x.totals.water + 1 } }));
          A.completeTask('water'); ui.bubble('💧 Meta de água batida! Hidratação nível pro.');
        }
      },
      toggleCheck: (id: string) => {
        const today = dateKey(), st = ref.current, d = dayOf(st, today);
        const checks = d.checks.includes(id) ? d.checks.filter((c) => c !== id) : [...d.checks, id];
        patchDay(today, (x) => ({ ...x, checks }));
        haptic.light(); play('tick');
        if (st.checklist.length && st.checklist.every((c) => checks.includes(c.id)) && !d.tasks.checklist) {
          commit((x) => ({ ...x, totals: { ...x.totals, checklist: x.totals.checklist + 1 } }));
          A.completeTask('checklist');
        }
      },
      sleepNow: () => {
        const st = ref.current, now = new Date(), bed = minutesOf(st.profile.bedtime), cur = now.getHours() * 60 + now.getMinutes();
        let delta = cur - bed; if (delta < -720) delta += 1440; if (delta > 720) delta -= 1440;
        if (delta < -60 || delta > 120) { ui.bubble(`😴 Só vale perto da hora de dormir (${st.profile.bedtime}). Tenta de novo lá!`); return false; }
        const k = now.getHours() < 5 ? addDays(dateKey(now), -1) : dateKey(now);
        if (dayOf(st, k).tasks.sleep) { ui.bubble('Você já marcou o sono de hoje 😉'); return false; }
        patchDay(k, (d) => ({ ...d, tasks: { ...d.tasks, sleep: true } }));
        commit((x) => ({ ...x, totals: { ...x.totals, sleep: x.totals.sleep + 1 } }));
        A.award(XP.sleep, '😴'); A.afterEvent(); ui.bubble('Boa noite, campeão! 🌙'); return true;
      },

      // ---------- Missões / baús ----------
      claimMission: (key: string, xp: number, coins: number) => {
        if (ref.current.claimed[key]) return;
        commit((x) => ({ ...x, claimed: { ...x.claimed, [key]: true }, totals: { ...x.totals, missions: x.totals.missions + 1 } }));
        A.award(xp, '🎯', coins); ui.celebrate(); play('success'); A.afterEvent();
      },
      claimBoss: () => {
        const st = ref.current, mk = monthKey(), b = bossOfMonth(mk), key = `boss-${mk}`;
        if (st.claimed[key] || metricOnMonth(st, mk, b.metric) < b.target) return;
        commit((x) => ({ ...x, claimed: { ...x.claimed, [key]: true }, totals: { ...x.totals, bossWins: x.totals.bossWins + 1 } }));
        A.award(b.xp, '👹', b.coins); ui.celebrate(); ui.emit({ t: 'chest', rarity: 'lendario', title: `${b.name} derrotado!`, lines: [`+${b.xp} XP`, `+${b.coins} 🪙`] });
        A.afterEvent();
      },
      openChest: (kind: 'daily' | 'special') => {
        const st = ref.current, today = dateKey();
        if (st.chestFlags[kind] === today) return;
        if (kind === 'special' && dayProgress(st, today).pct < 1) { ui.bubble('Complete todas as tarefas do dia para abrir o baú especial 🔒'); return; }
        const r: ChestReward = rollChest(kind === 'special');
        commit((x) => ({ ...x, chestFlags: { ...x.chestFlags, [kind]: today }, coins: x.coins + r.coins, xp: x.xp + 0, shields: x.shields + (r.shield ? 1 : 0), totals: { ...x.totals, chests: x.totals.chests + 1 } }));
        const lines = [`+${r.coins} 🪙`, `+${r.xp} XP`, ...(r.shield ? ['🛡️ Escudo de sequência'] : [])];
        ui.emit({ t: 'chest', rarity: r.rarity, title: kind === 'daily' ? 'Baú diário' : 'Baú especial', lines });
        setTimeout(() => A.award(r.xp, undefined, 0), 2200);
      },
      spinWheel: (): number => {
        const st = ref.current, wk = weekStart();
        if (st.chestFlags.wheel === wk || streakNow(st) < 7) return -1;
        commit((x) => ({ ...x, chestFlags: { ...x.chestFlags, wheel: wk }, totals: { ...x.totals, spins: x.totals.spins + 1 } }));
        return Math.floor(Math.random() * WHEEL.length);
      },
      applyWheel: (idx: number) => {
        const w = WHEEL[idx];
        commit((x) => ({ ...x, shields: x.shields + (w.shield ? 1 : 0) }));
        if (w.coins) { A.addCoins(w.coins); play('coin'); }
        if (w.xp) A.award(w.xp, undefined, 0);
        ui.celebrate(); haptic.success(); ui.bubble(`🎡 Você ganhou: ${w.label}`);
      },

      // ---------- Loja / prêmios ----------
      buyItem: (id: string) => {
        const st = ref.current, it = itemById(id);
        if (!it || st.inventory.includes(id)) return false;
        if (st.coins < it.price) { ui.bubble('Faltam moedas 🪙 — bora treinar!'); haptic.warn(); return false; }
        commit((x) => ({ ...x, coins: x.coins - it.price, inventory: [...x.inventory, id] }));
        play('coin'); haptic.success(); ui.bubble(`🛍️ ${it.name} comprado!`); A.checkAchievements(); return true;
      },
      buyShield: () => {
        const st = ref.current;
        if (st.coins < SHIELD_PRICE) { ui.bubble('Faltam moedas 🪙'); return; }
        commit((x) => ({ ...x, coins: x.coins - SHIELD_PRICE, shields: x.shields + 1 }));
        play('coin'); haptic.success(); ui.bubble('🛡️ Escudo de sequência comprado!');
      },
      equip: (id: string) => { const it = itemById(id); if (!it || !ref.current.inventory.includes(id)) return; commit((x) => ({ ...x, equipped: { ...x.equipped, [it.slot]: id } })); haptic.light(); },
      addReward: (name: string, cost: number) => commit((x) => ({ ...x, rewards: [...x.rewards, { id: uid(), name, cost }] })),
      removeReward: (id: string) => commit((x) => ({ ...x, rewards: x.rewards.filter((r) => r.id !== id) })),
      redeem: (r: RealReward) => {
        const st = ref.current;
        if (st.coins < r.cost) { ui.bubble(`Faltam ${r.cost - st.coins} 🪙 para esse prêmio. Bora juntar!`); return; }
        commit((x) => ({ ...x, coins: x.coins - r.cost, redeemed: [{ id: uid(), name: r.name, cost: r.cost, at: dateKey() }, ...x.redeemed].slice(0, 50), totals: { ...x.totals, redeemed: x.totals.redeemed + 1 } }));
        ui.emit({ t: 'chest', rarity: 'lendario', title: 'Prêmio resgatado!', lines: [r.name, 'Mostre isso pra quem paga 😎'] });
        A.afterEvent();
      },

      // ---------- Amigos ----------
      myCode: () => {
        const st = ref.current, today = dateKey(), wk = weekStart(today);
        const weekXp = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).reduce((a, k) => a + (st.days[k]?.xp ?? 0), 0);
        const payload = { n: st.profile.name, l: levelFromXp(st.xp).level, o: A.overall(), w: weekXp, f: metricOnWeek(st, today, 'ft'), a: st.profile.avatar, e: st.equipped };
        return 'RP1.' + b64e(JSON.stringify(payload));
      },
      overall: () => attributes(ref.current).overall,
      addFriend: (code: string): string => {
        try {
          const c = code.trim();
          if (!c.startsWith('RP1.')) return 'Código inválido.';
          if (c === A.myCode()) return 'Esse é o seu próprio código 😅';
          const p = JSON.parse(b64d(c.slice(4)));
          const f: Friend = { code: c, name: String(p.n).slice(0, 20), level: p.l, overall: p.o, weekXp: p.w, weekFt: p.f, avatar: p.a, equipped: p.e ?? {}, updated: dateKey() };
          const dupe = ref.current.friends.find((x) => x.name === f.name);
          commit((x) => ({ ...x, friends: [...x.friends.filter((y) => y !== dupe), f] }));
          A.checkAchievements();
          return `${f.name} adicionado! 🤝`;
        } catch { return 'Código inválido.'; }
      },
      removeFriend: (code: string) => commit((x) => ({ ...x, friends: x.friends.filter((f) => f.code !== code), challenges: x.challenges.filter((c) => c.friendCode !== code) })),
      addChallenge: (friendCode: string, metric: 'ft' | 'xp') => {
        const st = ref.current, today = dateKey();
        commit((x) => ({ ...x, challenges: [...x.challenges, { id: uid(), friendCode, metric, week: weekStart(today), myBase: 0 }] }));
        ui.bubble('⚔️ Desafio criado! Atualize o código do amigo durante a semana.');
        void st;
      },
      removeChallenge: (id: string) => commit((x) => ({ ...x, challenges: x.challenges.filter((c) => c.id !== id) })),

      reschedule: () => rescheduleAll(ref.current, !!dayOf(ref.current, dateKey()).basketStarted),
      // ---------- Configurações / perfil ----------
      setSettings: (p: Partial<Settings>) => commit((x) => ({ ...x, settings: { ...x.settings, ...p } })),
      setTimes: (p: Partial<Settings['times']>) => commit((x) => ({ ...x, settings: { ...x.settings, times: { ...x.settings.times, ...p } } })),
      setNotifs: (p: Partial<Settings['notifs']>) => commit((x) => ({ ...x, settings: { ...x.settings, notifs: { ...x.settings.notifs, ...p } } })),
      setProfile: (p: Partial<State['profile']>) => commit((x) => ({ ...x, profile: { ...x.profile, ...p } })),
      setAvatar: (p: Partial<AvatarCfg>) => commit((x) => ({ ...x, profile: { ...x.profile, avatar: { ...x.profile.avatar, ...p } } })),
      setChecklist: (list: { id: string; label: string }[]) => commit((x) => ({ ...x, checklist: list })),
      setWorkoutLevel: (l: Level) => commit((x) => ({ ...x, workoutLevel: l })),
      addWorkout: (w: Workout) => commit((x) => ({ ...x, customWorkouts: [...x.customWorkouts, w] })),
      removeWorkout: (id: string) => commit((x) => ({ ...x, customWorkouts: x.customWorkouts.filter((w) => w.id !== id) })),
      finishOnboarding: (p: { name: string; schoolTime: string; bedtime: string }) =>
        commit((x) => ({ ...x, onboarded: true, profile: { ...x.profile, ...p }, lastOpen: dateKey(), prevOpen: dateKey() })),
      reset: async () => { await AsyncStorage.removeItem(KEY); commit(() => ({ ...initialState(), loaded: true })); },
    };
    return A;
  }, [commit, patchDay]);

  // ---------- Carregar / salvar ----------
  useEffect(() => {
    (async () => {
      let saved: Partial<State> = {};
      try { const raw = await AsyncStorage.getItem(KEY); if (raw) saved = JSON.parse(raw); } catch {}
      const st = mergeLoaded(initialState(), saved);
      ref.current = st; setS(st);
      initAudio();
      // abertura do app
      const now = new Date(), today = dateKey(now);
      const prev = st.lastOpen;
      commit((x) => ({ ...x, prevOpen: prev && prev !== today ? prev : x.prevOpen || today, lastOpen: today, openedAt3am: x.openedAt3am || now.getHours() === 3 }));
      if (st.onboarded) { actions.checkAchievements(); rescheduleAll(ref.current, !!dayOf(ref.current, today).basketStarted); }
    })();
  }, [actions, commit]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!s.loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { const { loaded, ...rest } = ref.current; void loaded; AsyncStorage.setItem(KEY, JSON.stringify(rest)).catch(() => {}); }, 300);
  }, [s]);

  // sincroniza config de áudio/vibração
  useEffect(() => {
    audioCfg.sound = s.settings.sound; audioCfg.haptics = s.settings.haptics; audioCfg.music = s.settings.music;
    audioCfg.alarm = equippedValue(s, 'alarm') as SoundName;
  }, [s.settings.sound, s.settings.haptics, s.settings.music, s.equipped]);

  // reagenda notificações quando horários/ajustes mudam
  const schedSig = JSON.stringify([s.settings.times, s.settings.notifs, s.settings.muteWeekends, s.settings.vacation, s.settings.personality, s.settings.funny, s.profile.bedtime, s.profile.birthday, s.profile.name]);
  const firstSched = useRef(true);
  useEffect(() => {
    if (!s.loaded || !s.onboarded) return;
    if (firstSched.current) { firstSched.current = false; return; }
    const t = setTimeout(() => rescheduleAll(ref.current, !!dayOf(ref.current, dateKey()).basketStarted), 800);
    return () => clearTimeout(t);
  }, [schedSig, s.loaded, s.onboarded]);

  return { s, A: actions };
}

type Ctx = ReturnType<typeof useStoreInternal>;
const StoreCtx = createContext<Ctx | null>(null);
export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const v = useStoreInternal();
  return <StoreCtx.Provider value={v}>{children}</StoreCtx.Provider>;
};
export const useStore = () => useContext(StoreCtx)!;
export const useGame = () => {
  const { s } = useStore();
  const lv = levelFromXp(s.xp);
  return { ...lv, streak: streakNow(s), mult: multiplier(streakNow(s)) };
};
export { missionProgress, dailyMissions, weeklyMissions };
export type { Rarity };
