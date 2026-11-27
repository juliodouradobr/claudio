import React, { useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useStore } from '../../store';
import { Btn, Card, Chip, H2, Input, Row, T, TimeField, Toggle } from '../../components/ui';
import { Personality } from '../../types';
import { getPermission, notifyNow, requestPermission } from '../../services/notifications';
import { useTheme } from '../../theme';
import { play } from '../../services/sound';
import { ui } from '../../store/ui';

const PERS: { id: Personality; label: string; sub: string }[] = [
  { id: 'durao', label: 'Treinador durão', sub: 'direto e exigente' },
  { id: 'zoeiro', label: 'Amigo zoeiro', sub: 'brincalhão (padrão)' },
  { id: 'calmo', label: 'Calmo e motivador', sub: 'tranquilo e gentil' },
];
const addMin = (hhmm: string, d: number) => { const [h, m] = hhmm.split(':').map(Number); const t = (h * 60 + m + d + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

export default function SettingsSection() {
  const { s, A } = useStore();
  const t = useTheme();
  const st = s.settings;
  const [bd, setBd] = useState(s.profile.birthday);
  const [name, setName] = useState(s.profile.name);

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <H2 style={{ marginBottom: 6 }}>Perfil</H2>
        <Input value={name} onChangeText={(v) => { setName(v); if (v.trim()) A.setProfile({ name: v.trim() }); }} placeholder="Seu nome" maxLength={20} />
        <T size={12} weight="bold" color={t.sub} style={{ marginTop: 10 }}>Aniversário (DD/MM) 🎂</T>
        <Input value={bd} onChangeText={(v) => { const c = v.replace(/[^\d/]/g, '').slice(0, 5); setBd(c); if (/^\d{1,2}\/\d{1,2}$/.test(c) || c === '') A.setProfile({ birthday: c }); }} placeholder="ex.: 15/08" keyboardType="numeric" />
        <Toggle label="Tema claro" value={st.theme === 'light'} onChange={(v) => A.setSettings({ theme: v ? 'light' : 'dark' })} />
      </Card>

      <Card>
        <H2 style={{ marginBottom: 6 }}>Personalidade do coach 🧢</H2>
        <View style={{ gap: 8 }}>{PERS.map((p) => <Chip key={p.id} label={`${p.label} — ${p.sub}`} active={st.personality === p.id} onPress={() => A.setSettings({ personality: p.id })} />)}</View>
        <Toggle label="Mensagens engraçadas" sub="Desligado = mensagens calmas e objetivas" value={st.funny} onChange={(v) => A.setSettings({ funny: v })} />
      </Card>

      <Card>
        <H2 style={{ marginBottom: 4 }}>Horários e alarmes ⏰</H2>
        <TimeField label="🏀 Alarme do basquete" value={st.times.basket} onChange={(v) => A.setTimes({ basket: v, basketPre: addMin(v, -15) })} />
        <TimeField label="⏳ Aviso antes do basquete" value={st.times.basketPre} onChange={(v) => A.setTimes({ basketPre: v })} />
        <TimeField label="🎧 Fone p/ carregar (noite)" value={st.times.fone} onChange={(v) => A.setTimes({ fone: v })} />
        <TimeField label="🎒 “Pegou o fone?” (manhã)" value={st.times.foneMorning} onChange={(v) => A.setTimes({ foneMorning: v })} />
        <TimeField label="😴 Hora de dormir" value={s.profile.bedtime} onChange={(v) => A.setProfile({ bedtime: v })} />
        <Row style={{ paddingVertical: 8 }}><T weight="semi" style={{ flex: 1 }}>Aviso de sono (min antes)</T><Chip label="15" active={st.times.bedPre === 15} onPress={() => A.setTimes({ bedPre: 15 })} /><Chip label="30" active={st.times.bedPre === 30} onPress={() => A.setTimes({ bedPre: 30 })} /><Chip label="60" active={st.times.bedPre === 60} onPress={() => A.setTimes({ bedPre: 60 })} /></Row>
        <Row style={{ paddingVertical: 8 }}><T weight="semi" style={{ flex: 1 }}>Água a cada (h)</T>{[1, 2, 3].map((h) => <Chip key={h} label={String(h)} active={st.times.waterEvery === h} onPress={() => A.setTimes({ waterEvery: h })} />)}</Row>
        <Row style={{ paddingVertical: 8 }}><T weight="semi" style={{ flex: 1 }}>Meta de copos</T>{[6, 8, 10].map((n) => <Chip key={n} label={String(n)} active={st.waterGoal === n} onPress={() => A.setSettings({ waterGoal: n })} />)}</Row>
      </Card>

      <Card>
        <H2 style={{ marginBottom: 4 }}>Lembretes</H2>
        <Toggle label="🏀 Basquete (13:00 e aviso)" value={st.notifs.basket} onChange={(v) => A.setNotifs({ basket: v })} />
        <Toggle label="👀 Aviso de treino atrasado (+15 min)" value={st.notifs.late} onChange={(v) => A.setNotifs({ late: v })} />
        <Toggle label="🎧 Fone e mochila (dias de aula)" value={st.notifs.fone} onChange={(v) => A.setNotifs({ fone: v })} />
        <Toggle label="💧 Beber água" value={st.notifs.water} onChange={(v) => A.setNotifs({ water: v })} />
        <Toggle label="😴 Hora de dormir" value={st.notifs.bed} onChange={(v) => A.setNotifs({ bed: v })} />
        <Toggle label="😢 “Sumiu, hein?” (dias sem abrir)" value={st.notifs.miss} onChange={(v) => A.setNotifs({ miss: v })} />
        <View style={{ height: 1, backgroundColor: t.border, marginVertical: 6 }} />
        <Toggle label="Silenciar fins de semana" sub="Sem lembretes sábado e domingo" value={st.muteWeekends} onChange={(v) => A.setSettings({ muteWeekends: v })} />
        <Toggle label="Modo férias 🏖️" sub="Desliga todos os lembretes e a checklist da escola" value={st.vacation} onChange={(v) => A.setSettings({ vacation: v })} />
        <Row style={{ marginTop: 8 }}>
          <Btn small outline label="Testar notificação" icon="notifications" style={{ flex: 1 }} onPress={async () => { if (!(await getPermission())) { const ok = await requestPermission(); if (!ok) { Alert.alert('Notificações desligadas', 'Ative nas configurações do celular.', [{ text: 'Abrir', onPress: () => Linking.openSettings() }, { text: 'Fechar' }]); return; } } notifyNow('🏀 Rotina Pro', A.msg('basketNow')); }} />
          <Btn small outline label="Permissão" icon="lock-open" style={{ flex: 1 }} onPress={async () => ui.bubble((await requestPermission()) ? 'Notificações ativas ✅' : 'Permissão negada — ative nos ajustes do celular')} />
        </Row>
      </Card>

      <Card>
        <H2 style={{ marginBottom: 4 }}>Som e sensação</H2>
        <Toggle label="🔊 Efeitos sonoros" value={st.sound} onChange={(v) => A.setSettings({ sound: v })} />
        <Toggle label="🎵 Música durante os treinos" value={st.music} onChange={(v) => A.setSettings({ music: v })} />
        <Toggle label="📳 Vibração" value={st.haptics} onChange={(v) => A.setSettings({ haptics: v })} />
        <Btn small outline label="Ouvir alarme equipado" icon="volume-high" onPress={() => { play('alarm_classic'); A.say('basketNow'); }} style={{ marginTop: 6 }} />
      </Card>

      <Card>
        <H2 style={{ marginBottom: 4 }}>Avançado</H2>
        <Toggle label="🧪 Modo teste (tempo acelerado, sem XP)" sub="Para testar cronômetros rapidamente. Não dá XP nem moedas." value={st.testMode} onChange={(v) => A.setSettings({ testMode: v })} />
        <Btn outline small color={t.danger} label="Apagar todos os dados" icon="trash" style={{ marginTop: 8 }} onPress={() => Alert.alert('Apagar tudo?', 'Isso remove seu progresso, XP e itens. Não dá pra desfazer.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: () => A.reset() }])} />
      </Card>
    </View>
  );
}
