import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../../store';
import { Bar, Btn, Card, H2, Input, Ionicons, Row, T } from '../../components/ui';
import { useTheme } from '../../theme';
import { parseKey } from '../../utils/date';

export default function RewardsSection() {
  const { s, A } = useStore();
  const t = useTheme();
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  return (
    <View style={{ gap: 14 }}>
      <Card><Row><T size={34}>🪙</T><View style={{ flex: 1 }}><T size={26} weight="black">{s.coins.toLocaleString('pt-BR')}</T><T size={12} color={t.sub}>Seus prêmios da vida real (combine com quem paga 😉)</T></View></Row></Card>
      {s.rewards.map((r) => {
        const ok = s.coins >= r.cost;
        return (
          <Card key={r.id} glow={ok ? t.green + '88' : undefined}>
            <Row><T weight="black" size={16} style={{ flex: 1 }}>{r.name}</T><Pressable onPress={() => A.removeReward(r.id)}><Ionicons name="trash-outline" size={20} color={t.sub} /></Pressable></Row>
            <Row style={{ marginVertical: 8 }}><View style={{ flex: 1 }}><Bar pct={s.coins / r.cost} color={ok ? t.green : t.accent} height={10} /></View><T weight="black" size={13}>{Math.min(s.coins, r.cost)}/{r.cost} 🪙</T></Row>
            <Btn label={ok ? 'Resgatar 🎁' : `Faltam ${r.cost - s.coins} 🪙`} onPress={() => A.redeem(r)} disabled={!ok} color={t.green} />
          </Card>
        );
      })}
      <Card>
        <H2 style={{ marginBottom: 8 }}>Novo prêmio</H2>
        <Input value={name} onChangeText={setName} placeholder="Ex.: Sorvete no domingo 🍦" maxLength={40} />
        <Row style={{ marginTop: 8 }}>
          <Input value={cost} onChangeText={(v) => setCost(v.replace(/\D/g, ''))} placeholder="Custo em moedas" keyboardType="numeric" style={{ flex: 1 }} />
          <Btn label="Adicionar" icon="add" onPress={() => { const c = parseInt(cost, 10); if (name.trim() && c > 0) { A.addReward(name.trim(), c); setName(''); setCost(''); } }} />
        </Row>
      </Card>
      {s.redeemed.length > 0 && (
        <Card>
          <H2 style={{ marginBottom: 6 }}>Já resgatados</H2>
          {s.redeemed.map((r) => <Row key={r.id} style={{ paddingVertical: 6 }}><T style={{ flex: 1 }} weight="semi">🎁 {r.name}</T><T size={12} color={t.sub}>{parseKey(r.at).toLocaleDateString('pt-BR')} · {r.cost}🪙</T></Row>)}
        </Card>
      )}
    </View>
  );
}
