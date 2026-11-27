import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, H1, Screen, Card, H2, T } from '../components/ui';
import CardSection from './profile/CardSection';
import ShopSection from './profile/ShopSection';
import RewardsSection from './profile/RewardsSection';
import TrophySection from './profile/TrophySection';
import FriendsSection from './profile/FriendsSection';
import SettingsSection from './profile/SettingsSection';
import { BossCard, DailyMissions, WeeklyMissions } from '../components/Missions';
import { useStore } from '../store';
import { useTheme } from '../theme';

const TABS = ['Carta', 'Missões', 'Loja', 'Prêmios', 'Troféus', 'Amigos', 'Config'] as const;

function MissionsSection() {
  const t = useTheme();
  const { s } = useStore();
  return (
    <View style={{ gap: 14 }}>
      <BossCard />
      <Card><H2 style={{ marginBottom: 4 }}>Missões diárias 🎯</H2><T size={12} color={t.sub}>3 por dia · renovam à meia-noite</T><DailyMissions /></Card>
      <Card><H2 style={{ marginBottom: 4 }}>Missões semanais 🔥</H2><T size={12} color={t.sub}>Mais difíceis, recompensa maior</T><WeeklyMissions /></Card>
      <T size={12} color={t.sub}>Missões concluídas no total: {s.totals.missions}</T>
    </View>
  );
}

export default function Profile() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Carta');
  return (
    <Screen>
      <H1>Perfil</H1>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
        {TABS.map((x) => <Chip key={x} label={x} active={tab === x} onPress={() => setTab(x)} />)}
      </ScrollView>
      {tab === 'Carta' && <CardSection />}
      {tab === 'Missões' && <MissionsSection />}
      {tab === 'Loja' && <ShopSection />}
      {tab === 'Prêmios' && <RewardsSection />}
      {tab === 'Troféus' && <TrophySection />}
      {tab === 'Amigos' && <FriendsSection />}
      {tab === 'Config' && <SettingsSection />}
    </Screen>
  );
}
