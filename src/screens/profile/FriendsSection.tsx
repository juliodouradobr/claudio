import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { useStore, useGame } from '../../store';
import { Btn, Card, Chip, H2, Input, Row, T } from '../../components/ui';
import { Avatar } from '../../components/graphics';
import { metricOnWeek } from '../../data/game';
import { addDays, dateKey, weekStart } from '../../utils/date';
import { useTheme } from '../../theme';
import { ui } from '../../store/ui';

export default function FriendsSection() {
  const { s, A } = useStore();
  const t = useTheme();
  const g = useGame();
  const [code, setCode] = useState('');
  const today = dateKey(), wk = weekStart(today);
  const myWeekXp = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).reduce((a, k) => a + (s.days[k]?.xp ?? 0), 0);
  const myFt = metricOnWeek(s, today, 'ft');
  const rank = [{ code: 'me', name: s.profile.name + ' (você)', level: g.level, weekXp: myWeekXp, me: true }, ...s.friends.map((f) => ({ code: f.code, name: f.name, level: f.level, weekXp: f.weekXp, me: false }))].sort((a, b) => b.weekXp - a.weekXp);
  const [chMetric, setChMetric] = useState<'ft' | 'xp'>('ft');
  const [target, setTarget] = useState('');

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <H2>Seu código de jogador</H2>
        <T size={12} color={t.sub} style={{ marginVertical: 6 }}>Mande para um amigo. Ele cola no app dele e vocês aparecem no ranking um do outro. Reenvie o código durante a semana para atualizar seu XP e seu nível.</T>
        <View style={{ backgroundColor: t.accentSoft, borderRadius: 14, padding: 10 }}><T size={11} weight="semi" numberOfLines={3}>{A.myCode()}</T></View>
        <Btn label="Compartilhar meu código" icon="share-social" onPress={() => Share.share({ message: `Meu código no Rotina Pro (nível ${g.level}):\n${A.myCode()}` })} style={{ marginTop: 10 }} />
      </Card>
      <Card>
        <H2 style={{ marginBottom: 8 }}>Adicionar / atualizar amigo</H2>
        <Input value={code} onChangeText={setCode} placeholder="Cole o código do amigo (RP1....)" />
        <Btn label="Adicionar" icon="person-add" onPress={() => { const m = A.addFriend(code); ui.bubble(m); if (m.includes('adicionado')) setCode(''); }} style={{ marginTop: 10 }} disabled={!code.trim()} />
      </Card>

      <Card>
        <H2 style={{ marginBottom: 6 }}>Ranking semanal de XP 🏆</H2>
        {rank.map((r, i) => (
          <Row key={r.code} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}>
            <T size={20}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}º`}</T>
            <View style={{ flex: 1 }}><T weight={r.me ? 'black' : 'bold'} color={r.me ? t.accent : t.text}>{r.name}</T><T size={11} color={t.sub}>Nível {r.level}</T></View>
            <T weight="black">{r.weekXp} XP</T>
          </Row>
        ))}
      </Card>

      {s.friends.map((f) => (
        <Card key={f.code}>
          <Row>
            <Avatar cfg={f.avatar} equipped={{ ...s.equipped, ...f.equipped }} size={70} ball={false} />
            <View style={{ flex: 1 }}>
              <T weight="black" size={18}>{f.name}</T>
              <T size={12} color={t.sub}>Nível {f.level} · Nota {f.overall}</T>
              <T size={11} color={t.sub}>XP na semana: {f.weekXp} · lances livres: {f.weekFt} · atualizado {f.updated.split('-').reverse().slice(0, 2).join('/')}</T>
            </View>
          </Row>
          <Row style={{ marginTop: 8 }}>
            <Btn small outline label="Remover" color={t.danger} onPress={() => A.removeFriend(f.code)} style={{ flex: 1 }} />
            <Btn small label="Desafiar ⚔️" onPress={() => A.addChallenge(f.code, chMetric)} style={{ flex: 1 }} />
          </Row>
        </Card>
      ))}

      {s.friends.length > 0 && (
        <Card>
          <H2>Desafios ⚔️</H2>
          <Row style={{ marginVertical: 8 }}><Chip label="Lances livres" active={chMetric === 'ft'} onPress={() => setChMetric('ft')} /><Chip label="XP da semana" active={chMetric === 'xp'} onPress={() => setChMetric('xp')} /></Row>
          <T size={12} color={t.sub}>Escolha a modalidade e toque em “Desafiar” no amigo. Quem fizer mais na semana vence!</T>
          {s.challenges.filter((c) => c.week === wk).map((c) => {
            const f = s.friends.find((x) => x.code === c.friendCode);
            if (!f) return null;
            const mine = c.metric === 'ft' ? myFt : myWeekXp, theirs = c.metric === 'ft' ? f.weekFt : f.weekXp;
            return (
              <Row key={c.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.border, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <T weight="black">{c.metric === 'ft' ? '🎯 Lances livres' : '⭐ XP'} vs {f.name}</T>
                  <T size={13} color={mine >= theirs ? t.green : t.danger} weight="bold">{mine >= theirs ? 'Você está na frente! ' : 'Ele está na frente. '}{mine} x {theirs}</T>
                </View>
                <Btn small outline label="X" color={t.sub} onPress={() => A.removeChallenge(c.id)} />
              </Row>
            );
          })}
        </Card>
      )}
      <T size={11} color={t.sub}>ℹ️ O app funciona 100% offline: amigos são trocados por código (sem servidor). Os números do amigo atualizam quando ele reenviar o código.</T>
    </View>
  );
}
