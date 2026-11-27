import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame, useStore } from '../store';
import { Bar, Btn, Card, Check, H1, H2, Input, Ionicons, Pulse, Row, Screen, T } from '../components/ui';
import { Ring } from '../components/graphics';
import { DailyMissions } from '../components/Missions';
import { activeTasks, dayOf, dayProgress } from '../data/game';
import { quoteOfDay } from '../data/messages';
import { dateKey, fmtLong, minutesOf } from '../utils/date';
import { useTheme } from '../theme';
import { useNow } from '../utils/hooks';
import Wheel from '../components/Wheel';

export default function Today() {
  const { s, A } = useStore();
  const t = useTheme();
  const nav = useNavigation<any>();
  const g = useGame();
  const now = useNow(20000);
  const today = dateKey(now);
  const day = dayOf(s, today);
  const prog = dayProgress(s, today);
  const tasks = activeTasks(s, today);
  const [greet, setGreet] = useState(() => A.greeting());
  const [editList, setEditList] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [wheel, setWheel] = useState(false);
  const typing = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setGreet(A.greeting());
    typing.setValue(0);
    Animated.spring(typing, { toValue: 1, useNativeDriver: true, bounciness: 10 }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, s.settings.personality, s.settings.funny]);

  const dailyReady = s.chestFlags.daily !== today;
  const specialReady = prog.pct >= 1 && s.chestFlags.special !== today;
  const wheelReady = s.chestFlags.wheel !== weekStartKey() && g.streak >= 7;
  const school = tasks.some((x) => x.id === 'checklist');
  const bedMin = minutesOf(s.profile.bedtime);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nearBed = Math.abs(((nowMin - bedMin + 1440 + 720) % 1440) - 720) <= 90;

  return (
    <Screen>
      <View>
        <T color={t.sub} weight="semi" style={{ textTransform: 'capitalize' }}>{fmtLong(now)}</T>
        <H1>Fala, {s.profile.name}! 👋</H1>
      </View>

      {/* balão do assistente */}
      <Pressable onPress={() => setGreet(A.greeting())}>
        <Animated.View style={{ opacity: typing, transform: [{ scale: typing.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <Card glow={t.accent + '88'}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}><T size={24}>🧢</T></View>
              <View style={{ flex: 1 }}>
                <T size={11} weight="black" color={t.accent} style={{ letterSpacing: 1.5 }}>COACH</T>
                <T weight="bold" size={16} style={{ marginTop: 2, lineHeight: 22 }}>{greet.text}</T>
              </View>
            </Row>
          </Card>
        </Animated.View>
      </Pressable>

      {/* progresso do dia */}
      <Card>
        <Row style={{ gap: 18 }}>
          <Ring pct={prog.pct} size={132}>
            <T size={30} weight="black">{Math.round(prog.pct * 100)}%</T>
            <T size={11} color={t.sub} weight="bold">{prog.done}/{prog.total} tarefas</T>
          </Ring>
          <View style={{ flex: 1, gap: 8 }}>
            <Pulse active={g.streak > 0}><T size={34} weight="black">🔥 {g.streak}</T></Pulse>
            <T weight="bold" size={13} color={t.sub}>{g.streak === 1 ? 'dia seguido' : 'dias seguidos'}</T>
            <View style={{ alignSelf: 'flex-start', backgroundColor: g.mult > 1 ? t.green : t.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <T size={12} weight="black" color={g.mult > 1 ? '#0F1115' : t.sub}>XP x{g.mult}</T>
            </View>
            <T size={11} color={t.sub}>{g.streak < 3 ? '3 dias = x1.2' : g.streak < 7 ? '7 dias = x1.5' : g.streak < 30 ? '30 dias = x2' : 'Multiplicador máximo!'}</T>
          </View>
        </Row>
        <T size={13} color={t.sub} style={{ marginTop: 14, fontStyle: 'italic' }}>“{quoteOfDay(now)}”</T>
      </Card>

      {/* baús */}
      {(dailyReady || specialReady || wheelReady) && (
        <View style={{ gap: 10 }}>
          {dailyReady && <Pulse><Btn label="Abrir baú diário grátis" icon="gift" onPress={() => A.openChest('daily')} big /></Pulse>}
          {specialReady && <Pulse><Btn label="Baú especial do dia completo!" icon="sparkles" color={t.green} onPress={() => A.openChest('special')} /></Pulse>}
          {wheelReady && <Pulse><Btn label="Roleta da sorte da semana 🎡" icon="disc" color="#B14DFF" textColor="#fff" onPress={() => setWheel(true)} /></Pulse>}
        </View>
      )}
      <Wheel visible={wheel} onClose={() => setWheel(false)} />

      {/* tarefas */}
      <Card>
        <H2 style={{ marginBottom: 6 }}>Tarefas de hoje</H2>
        {tasks.map((task) => {
          const done = !!day.tasks[task.id];
          const manual = task.id === 'sleep';
          return (
            <Pressable key={task.id} onPress={() => (task.tab ? nav.navigate(task.tab) : manual ? A.sleepNow() : null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Check done={done} />
              <T size={20}>{task.emoji}</T>
              <T weight="bold" style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{task.label}</T>
              <T size={12} weight="black" color={t.accent}>+{task.xp}</T>
              {task.tab && !done && <Ionicons name="chevron-forward" size={18} color={t.sub} />}
            </Pressable>
          );
        })}
        <T size={11} color={t.sub} style={{ marginTop: 8 }}>🔒 Corrida, treino em casa e basquete só contam quando o cronômetro termina. Sem atalho, campeão!</T>
      </Card>

      {/* missões */}
      <Card>
        <H2 style={{ marginBottom: 4 }}>Missões do dia 🎯</H2>
        <DailyMissions />
      </Card>

      {/* água */}
      <Card>
        <Row><H2 style={{ flex: 1 }}>Água 💧</H2><T weight="black" color={t.accent}>{day.water}/{s.settings.waterGoal} copos</T></Row>
        <View style={{ marginVertical: 10 }}><Bar pct={day.water / s.settings.waterGoal} color="#3B9BFF" height={12} /></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {Array.from({ length: Math.max(s.settings.waterGoal, day.water) }).map((_, i) => <T key={i} size={22} style={{ opacity: i < day.water ? 1 : 0.2 }}>🥤</T>)}
        </View>
        <Row><Btn outline small label="-1" onPress={() => A.addWater(-1)} style={{ flex: 1 }} /><Btn label="+1 copo" icon="water" color="#3B9BFF" onPress={() => A.addWater(1)} style={{ flex: 3 }} /></Row>
      </Card>

      {/* mochila */}
      {school && (
        <Card>
          <Row><H2 style={{ flex: 1 }}>Mochila e fone 🎒</H2><Pressable onPress={() => setEditList(!editList)}><T weight="bold" color={t.accent} size={13}>{editList ? 'Pronto' : 'Editar'}</T></Pressable></Row>
          {s.checklist.map((c) => (
            <Pressable key={c.id} onPress={() => (editList ? A.setChecklist(s.checklist.filter((x) => x.id !== c.id)) : A.toggleCheck(c.id))} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}>
              {editList ? <Ionicons name="trash" size={22} color={t.danger} /> : <Check done={day.checks.includes(c.id)} size={24} />}
              <T weight="semi" style={{ opacity: !editList && day.checks.includes(c.id) ? 0.5 : 1 }}>{c.label}</T>
            </Pressable>
          ))}
          {editList && (
            <Row style={{ marginTop: 6 }}>
              <Input value={newItem} onChangeText={setNewItem} placeholder="Novo item (ex.: caderno)" style={{ flex: 1 }} maxLength={30} />
              <Btn small label="Add" onPress={() => { if (newItem.trim()) { A.setChecklist([...s.checklist, { id: String(Date.now()), label: newItem.trim() }]); setNewItem(''); } }} />
            </Row>
          )}
          <T size={11} color={t.sub} style={{ marginTop: 6 }}>Marque tudo para ganhar +10 XP. Lembretes: noite ({s.settings.times.fone}) e manhã ({s.settings.times.foneMorning}), só em dias de aula.</T>
        </Card>
      )}

      {/* sono */}
      <Card>
        <Row><T size={30}>😴</T><View style={{ flex: 1 }}><H2>Hora de dormir</H2><T size={13} color={t.sub}>Meta: {s.profile.bedtime} · +30 XP</T></View></Row>
        <Btn label={day.tasks.sleep ? 'Sono de hoje registrado ✓' : 'Fui dormir'} icon="moon" disabled={!!day.tasks.sleep} onPress={() => A.sleepNow()} style={{ marginTop: 10 }} color={nearBed ? t.accent : t.sub} />
      </Card>
    </Screen>
  );
}
const weekStartKey = () => { const d = new Date(); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return dateKey(d); };
