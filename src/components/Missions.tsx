import React from 'react';
import { View } from 'react-native';
import { useStore } from '../store';
import { BOSS_POOL, bossOfMonth, dailyMissions, metricOnMonth, missionProgress, weeklyMissions, MissionDef } from '../data/game';
import { dateKey, monthKey, mesNome, weekStart } from '../utils/date';
import { useTheme } from '../theme';
import { Bar, Btn, Card, H2, Row, T } from './ui';

function Mission({ def, k, weekly, id }: { def: MissionDef; k: string; weekly: boolean; id: string }) {
  const { s, A } = useStore();
  const t = useTheme();
  const p = missionProgress(s, def, k, weekly);
  const done = def.metric === 'lap3' ? p > 0 : p >= def.target;
  const claimed = s.claimed[id];
  return (
    <View style={{ gap: 8, paddingVertical: 6 }}>
      <Row><T weight="bold" style={{ flex: 1 }} size={14}>{def.text}</T><T size={12} weight="black" color={t.accent}>+{def.xp} XP · {def.coins}🪙</T></Row>
      <Row>
        <View style={{ flex: 1 }}><Bar pct={def.metric === 'lap3' ? (done ? 1 : 0) : p / def.target} color={done ? t.green : t.accent} /></View>
        <T size={12} weight="bold" color={t.sub}>{def.metric === 'lap3' ? (done ? '✓' : '—') : `${p}/${def.target}`}</T>
        {done && !claimed && <Btn small label="Resgatar" onPress={() => A.claimMission(id, def.xp, def.coins)} color={t.green} />}
        {claimed && <T size={12} weight="black" color={t.green}>✓ ok</T>}
      </Row>
    </View>
  );
}

export const DailyMissions = () => {
  const k = dateKey();
  return <View>{dailyMissions(k).map((m) => <Mission key={m.id} def={m} k={k} weekly={false} id={`${k}:${m.id}`} />)}</View>;
};
export const WeeklyMissions = () => {
  const k = dateKey(), wk = weekStart(k);
  return <View>{weeklyMissions(k).map((m) => <Mission key={m.id} def={m} k={k} weekly id={`${wk}:${m.id}`} />)}</View>;
};
export const BossCard = () => {
  const { s, A } = useStore();
  const t = useTheme();
  const mk = monthKey(), b = bossOfMonth(mk), prog = Math.min(b.target, metricOnMonth(s, mk, b.metric));
  const hp = 1 - prog / b.target, dead = prog >= b.target, claimed = s.claimed[`boss-${mk}`];
  void BOSS_POOL;
  return (
    <Card glow={t.danger + '88'}>
      <Row><T size={42}>{b.emoji}</T><View style={{ flex: 1 }}><T size={11} weight="black" color={t.danger} style={{ letterSpacing: 2 }}>MISSÃO-CHEFE · {mesNome(new Date().getMonth()).toUpperCase()}</T><H2>{b.name}</H2></View></Row>
      <T size={13} color={t.sub} style={{ marginVertical: 6 }}>{b.metric === 'shotsAtt' ? `Registre ${b.target} arremessos no mês` : b.metric === 'laps' ? `Corra ${b.target} voltas no mês` : `Acerte ${b.target} lances livres no mês`}</T>
      <Row><T size={12} weight="black" color={t.danger}>❤️ {Math.max(0, b.target - prog)}/{b.target}</T><View style={{ flex: 1 }}><Bar pct={hp} color={t.danger} height={14} /></View></Row>
      <T size={12} weight="bold" color={t.accent} style={{ marginTop: 8 }}>Recompensa: +{b.xp} XP · {b.coins} 🪙</T>
      {dead && !claimed && <Btn label="Derrotar o chefe! 🏆" onPress={A.claimBoss} style={{ marginTop: 10 }} />}
      {claimed && <T weight="black" color={t.green} style={{ marginTop: 8 }}>✓ Chefe derrotado este mês!</T>}
    </Card>
  );
};
