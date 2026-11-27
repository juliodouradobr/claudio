import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useStore } from '../store';
import { Bar, Btn, Card, H1, H2, Row, Screen, T } from '../components/ui';
import { LineChart, Ring } from '../components/graphics';
import { BLOCKS, HYDRATION_SEC, TOTAL_MIN } from '../data/basketball';
import { dayOf } from '../data/game';
import { useTheme } from '../theme';
import { useClock, useNow } from '../utils/hooks';
import { dateKey, fmtClock, hhmm, parseKey, weekDays, weekStart, addDays } from '../utils/date';
import { haptic, play, playAlarm, startMusic, stopMusic } from '../services/sound';
import { ui } from '../store/ui';

function Awake() { useKeepAwake(); return null; }
const TYPES: { id: 'ft' | 'mid' | 'three'; label: string; emoji: string }[] = [
  { id: 'ft', label: 'Lance livre', emoji: '🎯' }, { id: 'mid', label: 'Média distância', emoji: '🏀' }, { id: 'three', label: '3 pontos', emoji: '🔥' },
];
const pctOf = (m: number, a: number) => (a ? Math.round((m / a) * 100) : 0);

export default function Basketball() {
  const { s, A } = useStore();
  const t = useTheme();
  const now = useNow(1000);
  const speed = s.settings.testMode ? 60 : 1;
  const clock = useClock(speed);
  const [done, setDone] = useState(false);
  const fired = useRef({ block: -1, half: false, last10: false, hyd: -1, finished: false });
  const today = dateKey(now), day = dayOf(s, today);

  const total = TOTAL_MIN * 60;
  const elapsed = Math.min(total, clock.ms / 1000);
  const started = clock.running || clock.ms > 0;
  let acc = 0, bi = 0;
  for (let i = 0; i < BLOCKS.length; i++) { if (elapsed >= acc + BLOCKS[i].min * 60) { acc += BLOCKS[i].min * 60; bi = i + 1; } else { bi = i; break; } }
  const block = BLOCKS[Math.min(bi, BLOCKS.length - 1)];
  const inBlock = elapsed - acc, blockLeft = block.min * 60 - inBlock;
  const hydrating = started && !done && blockLeft <= HYDRATION_SEC && blockLeft > 0;

  // eventos do treino (troca de bloco, hidratação, metade, últimos 10 min, fim)
  useEffect(() => {
    if (!started || done) return;
    const f = fired.current;
    if (bi !== f.block && bi < BLOCKS.length) {
      if (f.block >= 0) { play('block'); playAlarm(); haptic.burst(); ui.bubble(`${BLOCKS[bi].emoji} Próximo bloco: ${BLOCKS[bi].name}! ${BLOCKS[bi].tips}`); }
      f.block = bi;
    }
    if (hydrating && f.hyd !== bi) { f.hyd = bi; play('beep'); haptic.medium(); ui.bubble('💧 Pausa de hidratação! Bebe uma água (1 min).'); }
    if (!f.half && elapsed >= total / 2) { f.half = true; A.say('basketHalf'); }
    if (!f.last10 && elapsed >= total - 600) { f.last10 = true; A.say('basketLast10'); }
    if (elapsed >= total && !f.finished) {
      f.finished = true; clock.pause(); setDone(true); stopMusic(); play('levelup');
      A.finishBasket(TOTAL_MIN, !s.settings.testMode);
    }
  });

  const start = () => {
    fired.current = { block: -1, half: false, last10: false, hyd: -1, finished: false };
    setDone(false); clock.reset(); clock.start(); startMusic();
    A.basketStarted(Date.now()); A.say('startWorkout'); haptic.medium();
    ui.bubble(`${BLOCKS[0].emoji} ${BLOCKS[0].name}: ${BLOCKS[0].tips}`);
  };
  const stop = () => { clock.reset(); stopMusic(); setDone(false); };

  // próximo treino
  const { h, m } = hhmm(s.settings.times.basket);
  const next = new Date(now); next.setHours(h, m, 0, 0);
  if (next.getTime() < now.getTime() - total * 1000) next.setDate(next.getDate() + 1);
  const untilSec = Math.round((next.getTime() - now.getTime()) / 1000);
  const late = untilSec < -15 * 60 && !day.basketStarted && !started && untilSec > -total;

  // arremessos
  const sh = day.shots;
  const all = [sh.ft, sh.mid, sh.three].reduce((a, x) => [a[0] + x[0], a[1] + x[1]], [0, 0]);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(weekStart(today), -7 * (7 - i))).map((wk) => {
    let mm = 0, aa = 0;
    weekDays(wk).forEach((d) => { const x = s.days[d]?.shots; if (x) [x.ft, x.mid, x.three].forEach((y) => { mm += y[0]; aa += y[1]; }); });
    return { wk, pct: aa ? (mm / aa) * 100 : null, aa };
  }).filter((w) => w.pct !== null);

  return (
    <Screen>
      {clock.running && <Awake />}
      <H1>Basquete 🏀</H1>

      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <T size={11} weight="black" color={t.accent} style={{ letterSpacing: 2 }}>TODO DIA · 2 HORAS</T>
            <H2>Alarme às {s.settings.times.basket}</H2>
            <T size={13} color={t.sub}>Aviso às {s.settings.times.basketPre}: “Prepare a bola e a água!”</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T size={11} color={t.sub} weight="bold">{untilSec > 0 ? 'FALTAM' : 'AGORA'}</T>
            <T size={22} weight="black" color={t.accent}>{untilSec > 0 ? fmtClock(untilSec) : '🏀'}</T>
          </View>
        </Row>
        {late && <T weight="bold" color={t.danger} size={13} style={{ marginTop: 8 }}>{A.msg('basketLate')}</T>}
        <T size={11} color={t.sub} style={{ marginTop: 8 }}>O alarme toca como notificação, mesmo com o app fechado (mude o horário em Perfil › Config).</T>
      </Card>

      {/* timer */}
      <Card glow={hydrating ? '#3B9BFF' : done ? t.green : undefined}>
        {!started && !done ? (
          <>
            <T size={13} color={t.sub} center>O treino só vale XP se o cronômetro rodar até o fim (2h).</T>
            <Btn big label="INICIAR TREINO" icon="play" onPress={start} style={{ marginTop: 12 }} />
          </>
        ) : done ? (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <T size={50}>🏆</T><H2>Treino de 2h concluído!</H2>
            <T color={t.sub} center>{s.settings.testMode ? 'Modo teste: sem XP' : '+150 XP e moedas na conta'}</T>
            <Btn label="Fechar" onPress={stop} style={{ marginTop: 8, alignSelf: 'stretch' }} />
          </View>
        ) : (
          <>
            <View style={{ alignItems: 'center' }}>
              <Ring size={220} stroke={16} pct={inBlock / (block.min * 60)} color={hydrating ? '#3B9BFF' : t.accent}>
                <T size={30}>{hydrating ? '💧' : block.emoji}</T>
                <T size={13} weight="black" color={hydrating ? '#3B9BFF' : t.accent}>{hydrating ? 'HIDRATAÇÃO' : block.name.toUpperCase()}</T>
                <T size={38} weight="black" style={{ fontVariant: ['tabular-nums'] }}>{fmtClock(blockLeft)}</T>
                <T size={11} color={t.sub} weight="bold">restam no bloco</T>
              </Ring>
            </View>
            <T size={13} color={t.sub} center style={{ marginTop: 10 }}>{block.tips}</T>
            <View style={{ marginTop: 12 }}><Bar pct={elapsed / total} color={t.green} height={10} /></View>
            <Row style={{ marginTop: 4 }}><T size={12} weight="bold" color={t.sub} style={{ flex: 1 }}>Decorrido {fmtClock(elapsed)}</T><T size={12} weight="bold" color={t.sub}>Total {fmtClock(total)}</T></Row>
            <Row style={{ marginTop: 12 }}>
              <Btn outline label={clock.running ? 'Pausar' : 'Retomar'} icon={clock.running ? 'pause' : 'play'} onPress={() => (clock.running ? clock.pause() : clock.start())} style={{ flex: 1 }} />
              <Btn outline label="Cancelar" icon="close" color={t.danger} onPress={stop} style={{ flex: 1 }} />
            </Row>
          </>
        )}
      </Card>

      {/* blocos */}
      <Card>
        <H2 style={{ marginBottom: 8 }}>Plano do treino</H2>
        {BLOCKS.map((b, i) => {
          const active = started && !done && i === bi, past = started && (done || i < bi);
          return (
            <Row key={b.id} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.border, opacity: past ? 0.45 : 1 }}>
              <T size={22}>{past ? '✅' : b.emoji}</T>
              <View style={{ flex: 1 }}><T weight={active ? 'black' : 'bold'} color={active ? t.accent : t.text}>{b.name}</T><T size={11} color={t.sub}>inclui 1 min de hidratação 💧</T></View>
              <T weight="black" color={active ? t.accent : t.sub}>{b.min} min</T>
            </Row>
          );
        })}
      </Card>

      {/* arremessos */}
      <Card>
        <Row><H2 style={{ flex: 1 }}>Arremessos de hoje</H2><T weight="black" size={22} color={t.green}>{pctOf(all[0], all[1])}%</T></Row>
        <T size={12} color={t.sub} style={{ marginBottom: 6 }}>{all[0]} acertos / {all[1]} tentativas</T>
        {TYPES.map((ty) => {
          const [mm, aa] = sh[ty.id];
          return (
            <View key={ty.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, gap: 8 }}>
              <Row><T size={20}>{ty.emoji}</T><T weight="black" style={{ flex: 1 }}>{ty.label}</T><T weight="black" color={t.accent}>{mm}/{aa} · {pctOf(mm, aa)}%</T></Row>
              <Row>
                <Btn label="Acertei" icon="checkmark" color={t.green} onPress={() => A.logShot(ty.id, true)} style={{ flex: 2 }} />
                <Btn label="Errei" icon="close" outline color={t.danger} onPress={() => A.logShot(ty.id, false)} style={{ flex: 2 }} />
                <Btn label="−✓" outline small color={t.sub} onPress={() => A.undoShot(ty.id, true)} style={{ flex: 1 }} />
                <Btn label="−✗" outline small color={t.sub} onPress={() => A.undoShot(ty.id, false)} style={{ flex: 1 }} />
              </Row>
            </View>
          );
        })}
        <T size={11} color={t.sub} style={{ marginTop: 4 }}>−✓ remove um acerto e −✗ remove um erro (para corrigir cliques errados).</T>
      </Card>

      <Card>
        <H2>Evolução semanal 📈</H2>
        <T size={12} color={t.sub} style={{ marginBottom: 6 }}>Aproveitamento (%) por semana</T>
        <LineChart data={weeks.map((w) => w.pct as number)} labels={weeks.map((w) => `${parseKey(w.wk).getDate()}/${parseKey(w.wk).getMonth() + 1}`)} color={t.accent} suffix="%" min={0} max={100} />
      </Card>
    </Screen>
  );
}
