import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame, useStore } from '../store';
import { titleOf } from '../data/game';
import { useTheme } from '../theme';
import { Bar, T } from './ui';

export default function TopBar() {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const { s } = useStore();
  const g = useGame();
  return (
    <View style={{ paddingTop: ins.top + 6, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: t.bg, borderBottomWidth: 1, borderBottomColor: t.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', shadowColor: t.accent, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 }}>
          <T weight="black" size={18} color="#0F1115">{g.level}</T>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T weight="black" size={14}>{titleOf(g.level)}</T>
            <T size={11} weight="bold" color={t.sub}>{g.level >= 100 ? 'MAX' : `${g.into}/${g.need} XP`}</T>
          </View>
          <View style={{ marginTop: 5 }}><Bar pct={g.level >= 100 ? 1 : g.into / g.need} color={t.green} height={9} /></View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T weight="black" size={14}>🪙 {s.coins.toLocaleString('pt-BR')}</T>
          <T weight="bold" size={12} color={t.accent}>🔥 {g.streak}{g.mult > 1 ? ` x${g.mult}` : ''}{s.shields ? ` 🛡️${s.shields}` : ''}</T>
        </View>
      </View>
    </View>
  );
}
