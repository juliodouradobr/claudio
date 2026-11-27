import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '../../store';
import { Btn, Card, Chip, H2, Row, T } from '../../components/ui';
import { ITEMS, Item, RARITY, SHIELD_PRICE, SLOT_LABEL, shopStock } from '../../data/game';
import { Slot } from '../../types';
import { dateKey } from '../../utils/date';
import { useTheme } from '../../theme';

const SLOTS = Object.keys(SLOT_LABEL) as Slot[];

export default function ShopSection() {
  const { s, A } = useStore();
  const t = useTheme();
  const [slot, setSlot] = useState<Slot>('jersey');
  const stock = shopStock(dateKey());
  const owned = ITEMS.filter((i) => s.inventory.includes(i.id) && i.slot === slot);
  const forSale = stock.filter((i) => i.slot === slot && !s.inventory.includes(i.id));
  const rareToday = stock.filter((i) => (i.rarity === 'epico' || i.rarity === 'lendario') && !s.inventory.includes(i.id));

  const row = (it: Item, mode: 'buy' | 'own') => {
    const r = RARITY[it.rarity], equipped = s.equipped[it.slot] === it.id;
    return (
      <Card key={it.id} pad={12} glow={it.rarity === 'lendario' ? r.glow : it.rarity === 'epico' ? r.glow : undefined} style={{ borderColor: r.color + '88' }}>
        <Row>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: r.color + '33', alignItems: 'center', justifyContent: 'center' }}><T size={28}>{it.emoji}</T></View>
          <View style={{ flex: 1 }}>
            <T weight="black">{it.name}</T>
            <T size={11} weight="black" color={r.color} style={{ letterSpacing: 1 }}>{r.label.toUpperCase()}</T>
          </View>
          {mode === 'buy' ? <Btn small label={`${it.price} 🪙`} onPress={() => A.buyItem(it.id)} color={s.coins >= it.price ? t.accent : t.sub} />
            : <Btn small label={equipped ? 'Equipado ✓' : 'Equipar'} outline={equipped} disabled={equipped} onPress={() => A.equip(it.id)} color={t.green} />}
        </Row>
      </Card>
    );
  };
  return (
    <View style={{ gap: 14 }}>
      <Card><Row><T size={34}>🪙</T><View style={{ flex: 1 }}><T size={26} weight="black">{s.coins.toLocaleString('pt-BR')}</T><T size={12} color={t.sub}>moedas · ganhe treinando, em missões e baús</T></View></Row></Card>
      {rareToday.length > 0 && <Card glow="#FFC83D88"><T weight="black" color="#FFC83D">✨ Itens raros na loja hoje!</T><T size={13} color={t.sub}>{rareToday.map((i) => i.emoji + ' ' + i.name).join(' · ')}</T><T size={11} color={t.sub} style={{ marginTop: 4 }}>O estoque muda todo dia — itens épicos e lendários aparecem só às vezes.</T></Card>}
      <Card>
        <Row><T size={30}>🛡️</T><View style={{ flex: 1 }}><H2>Escudo de sequência</H2><T size={12} color={t.sub}>Protege 1 dia perdido. Você tem {s.shields}.</T></View><Btn small label={`${SHIELD_PRICE} 🪙`} onPress={A.buyShield} /></Row>
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{SLOTS.map((k) => <Chip key={k} label={SLOT_LABEL[k]} active={slot === k} onPress={() => setSlot(k)} />)}</View>
      <H2>Meus itens — {SLOT_LABEL[slot]}</H2>
      {owned.map((i) => row(i, 'own'))}
      <H2>À venda hoje</H2>
      {forSale.length === 0 ? <T color={t.sub}>Nada novo nessa categoria hoje. Volte amanhã! 🌅</T> : forSale.map((i) => row(i, 'buy'))}
    </View>
  );
}
