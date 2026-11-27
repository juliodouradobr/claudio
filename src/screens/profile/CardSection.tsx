import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore, useGame } from '../../store';
import { Bar, Card, H2, Ionicons, Row, T, Chip } from '../../components/ui';
import { Avatar, BarChart, CourtBg, HAIR_COLORS, HAIR_STYLES, PlayerCard, Radar, SKINS } from '../../components/graphics';
import { ATTR_META, attributes, dayOf, dayProgress, equippedValue, titleOf } from '../../data/game';
import { DIAS_CURTOS, addDays, dateKey, mesNome, parseKey, weekDays } from '../../utils/date';
import { useTheme } from '../../theme';

export default function CardSection() {
  const { s, A } = useStore();
  const t = useTheme();
  const g = useGame();
  const { attrs, overall } = attributes(s);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [edit, setEdit] = useState(false);
  const wk = weekDays(dateKey());
  const dayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const sum = (f: (k: string) => number) => wk.reduce((a, k) => a + f(k), 0);
  const trained = sum((k) => (dayOf(s, k).tasks.workout ? 1 : 0) + (dayOf(s, k).tasks.basket ? 1 : 0));
  const minutes = sum((k) => dayOf(s, k).minutes), laps = sum((k) => dayOf(s, k).laps);
  const first = month.getDay(), dim = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const today = dateKey();
  const doneCount = Array.from({ length: dim }, (_, i) => dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1))).filter((k) => s.days[k]?.done).length;

  return (
    <View style={{ gap: 16 }}>
      <Card pad={0}>
        <CourtBg id={equippedValue(s, 'court') as string} height={250}>
          <Avatar cfg={s.profile.avatar} equipped={s.equipped} size={150} />
        </CourtBg>
        <View style={{ padding: 14 }}>
          <Row><View style={{ flex: 1 }}><T size={24} weight="black">{s.profile.name}</T><T color={t.accent} weight="bold">Nv {g.level} · {titleOf(g.level)}</T></View><Pressable onPress={() => setEdit(!edit)}><Ionicons name="color-palette" size={26} color={t.accent} /></Pressable></Row>
          {edit && (
            <View style={{ gap: 10, marginTop: 12 }}>
              <T size={12} weight="bold" color={t.sub}>Pele</T>
              <Row>{SKINS.map((c) => <Pressable key={c} onPress={() => A.setAvatar({ skin: c })} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: s.profile.avatar.skin === c ? 3 : 0, borderColor: t.accent }} />)}</Row>
              <T size={12} weight="bold" color={t.sub}>Cabelo</T>
              <Row style={{ flexWrap: 'wrap' }}>{HAIR_STYLES.map((h, i) => <Chip key={h} label={h} active={s.profile.avatar.hair === i} onPress={() => A.setAvatar({ hair: i })} />)}</Row>
              <Row>{HAIR_COLORS.map((c) => <Pressable key={c} onPress={() => A.setAvatar({ hairColor: c })} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: s.profile.avatar.hairColor === c ? 3 : 1, borderColor: s.profile.avatar.hairColor === c ? t.accent : t.border }} />)}</Row>
              <T size={12} color={t.sub}>Uniforme, tênis, bola e acessórios: compre na Loja e equipe lá. 🛍️</T>
            </View>
          )}
        </View>
      </Card>

      <PlayerCard name={s.profile.name} level={g.level} overall={overall} attrs={attrs} avatar={s.profile.avatar} equipped={s.equipped} />

      <Card>
        <H2>Atributos</H2>
        <View style={{ alignItems: 'center', marginVertical: 6 }}><Radar values={ATTR_META.map((m) => attrs[m.id])} size={250} /></View>
        {ATTR_META.map((m) => (
          <View key={m.id} style={{ marginVertical: 5 }}>
            <Row><T>{m.emoji}</T><T weight="bold" style={{ flex: 1 }}>{m.label}</T><T weight="black" color={t.accent}>{attrs[m.id]}</T></Row>
            <View style={{ marginTop: 4 }}><Bar pct={attrs[m.id] / 99} color={t.accent} height={8} /></View>
          </View>
        ))}
        <T size={11} color={t.sub} style={{ marginTop: 8 }}>💪 sobe com treinos em casa · ⚡ com corrida e recordes de volta · 🎯 com % de acerto · 🫀 com treinos completos · 🧠 com sequência e lembretes · 💧 com água e sono.</T>
      </Card>

      <Card>
        <H2>Esta semana 📊</H2>
        <Row style={{ marginVertical: 10 }}>
          {[['🏋️', trained, 'treinos'], ['⏱️', minutes, 'minutos'], ['🏃', laps, 'voltas']].map(([e, v, l]) => (
            <View key={String(l)} style={{ flex: 1, alignItems: 'center', backgroundColor: t.accentSoft, borderRadius: 18, paddingVertical: 12 }}>
              <T size={20}>{e}</T><T size={24} weight="black">{v}</T><T size={11} color={t.sub} weight="bold">{l}</T>
            </View>
          ))}
        </Row>
        <T size={12} color={t.sub} weight="bold" style={{ marginBottom: 6 }}>Minutos treinados por dia</T>
        <BarChart data={wk.map((k) => dayOf(s, k).minutes)} labels={dayLabels} />
      </Card>

      <Card>
        <Row>
          <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={24} color={t.accent} /></Pressable>
          <H2 style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>{mesNome(month.getMonth())} {month.getFullYear()}</H2>
          <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={24} color={t.accent} /></Pressable>
        </Row>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>{DIAS_CURTOS.map((d, i) => <T key={i} size={11} weight="bold" color={t.sub} style={{ flex: 1, textAlign: 'center' }}>{d}</T>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            if (!d) return <View key={i} style={{ width: `${100 / 7}%`, height: 40 }} />;
            const k = dateKey(new Date(month.getFullYear(), month.getMonth(), d));
            const done = s.days[k]?.done, any = s.days[k] && dayProgress(s, k).done > 0, isToday = k === today;
            return (
              <View key={i} style={{ width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? t.green : any ? t.accentSoft : 'transparent', borderWidth: isToday ? 2 : 0, borderColor: t.accent }}>
                  <T size={13} weight="bold" color={done ? '#0F1115' : t.text}>{d}</T>
                </View>
              </View>
            );
          })}
        </View>
        <T size={12} color={t.sub} style={{ marginTop: 8 }}>🟢 dia cumprido (50%+ das tarefas) · {doneCount} neste mês · 🔥 melhor sequência: {s.streak.best}</T>
      </Card>
    </View>
  );
}
void addDays; void parseKey;
