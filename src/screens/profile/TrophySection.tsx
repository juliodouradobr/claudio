import React from 'react';
import { View } from 'react-native';
import { useStore } from '../../store';
import { Card, H2, Row, T } from '../../components/ui';
import { ACHIEVEMENTS, TIER_COLOR, Tier } from '../../data/game';
import { useTheme } from '../../theme';

export default function TrophySection() {
  const { s } = useStore();
  const t = useTheme();
  const tiers: Tier[] = ['bronze', 'prata', 'ouro', 'platina'];
  return (
    <View style={{ gap: 14 }}>
      <Card>
        <H2>Sala de troféus 🏆</H2>
        <Row style={{ marginTop: 10, justifyContent: 'space-between' }}>
          {tiers.map((k) => {
            const all = ACHIEVEMENTS.filter((a) => a.tier === k), got = all.filter((a) => s.achievements[a.id]).length;
            return <View key={k} style={{ alignItems: 'center', flex: 1 }}><View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: TIER_COLOR[k], alignItems: 'center', justifyContent: 'center' }}><T size={22}>🏅</T></View><T size={11} weight="black" color={TIER_COLOR[k]} style={{ marginTop: 4, textTransform: 'uppercase' }}>{k}</T><T size={12} weight="bold">{got}/{all.length}</T></View>;
          })}
        </Row>
      </Card>
      {ACHIEVEMENTS.map((a) => {
        const got = !!s.achievements[a.id], hidden = a.secret && !got, c = TIER_COLOR[a.tier];
        return (
          <Card key={a.id} pad={12} glow={got ? c + '77' : undefined} style={{ opacity: got ? 1 : 0.6 }}>
            <Row>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: got ? c : t.border, alignItems: 'center', justifyContent: 'center' }}><T size={26}>{hidden ? '❓' : a.emoji}</T></View>
              <View style={{ flex: 1 }}>
                <T weight="black">{hidden ? 'Conquista secreta' : a.name}</T>
                <T size={12} color={t.sub}>{hidden ? 'Descubra jogando…' : a.desc}</T>
                <T size={11} weight="black" color={c} style={{ marginTop: 2, textTransform: 'uppercase' }}>{a.tier} · +{a.coins}🪙{a.secret ? ' · secreta' : ''}</T>
              </View>
              {got && <T size={20}>✅</T>}
            </Row>
          </Card>
        );
      })}
    </View>
  );
}
