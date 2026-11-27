import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { Btn, Card, H1, Input, Screen, T, TimeField } from '../components/ui';
import { Avatar, SKINS, HAIR_COLORS } from '../components/graphics';
import { useTheme } from '../theme';
import { requestPermission } from '../services/notifications';
import { Pressable } from 'react-native';

export default function Onboarding() {
  const { s, A } = useStore();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('Júlio');
  const [school, setSchool] = useState('07:00');
  const [bed, setBed] = useState('22:00');
  const [granted, setGranted] = useState<boolean | null>(null);
  const finish = async () => {
    A.finishOnboarding({ name: name.trim() || 'Júlio', schoolTime: school, bedtime: bed });
    setTimeout(() => A.reschedule(), 300);
  };
  return (
    <Screen style={{ paddingTop: ins.top + 30, minHeight: 700 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>{[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? t.accent : t.border }} />)}</View>
      {step === 0 && (
        <>
          <T size={60} center>🏀</T>
          <H1 style={{ textAlign: 'center' }}>Rotina Pro</H1>
          <T color={t.sub} center>Seu treinador de bolso. Treine, cumpra a rotina e suba de nível na vida real! 🚀</T>
          <Card><T weight="bold" style={{ marginBottom: 8 }}>Como você quer ser chamado?</T><Input value={name} onChangeText={setName} placeholder="Seu nome" maxLength={20} /></Card>
          <Card>
            <T weight="bold" style={{ marginBottom: 8 }}>Seu jogador</T>
            <View style={{ alignItems: 'center' }}><Avatar cfg={s.profile.avatar} equipped={s.equipped} size={130} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              {SKINS.map((c) => <Pressable key={c} onPress={() => A.setAvatar({ skin: c })} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: s.profile.avatar.skin === c ? 3 : 0, borderColor: t.accent }} />)}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 }}>
              {HAIR_COLORS.map((c) => <Pressable key={c} onPress={() => A.setAvatar({ hairColor: c })} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, borderWidth: s.profile.avatar.hairColor === c ? 3 : 0, borderColor: t.accent }} />)}
            </View>
          </Card>
          <Btn label="Continuar" icon="arrow-forward" onPress={() => setStep(1)} />
        </>
      )}
      {step === 1 && (
        <>
          <H1>Sua rotina ⏰</H1>
          <T color={t.sub}>Usamos isso para os lembretes do fone, da mochila e do sono. Dá pra mudar depois.</T>
          <Card><TimeField label="🏫 Horário da escola" value={school} onChange={setSchool} /><TimeField label="😴 Hora de dormir" value={bed} onChange={setBed} /></Card>
          <T size={13} color={t.sub}>O basquete já vem às 13:00 (duas horas de treino) — você pode mudar nas configurações.</T>
          <View style={{ flexDirection: 'row', gap: 10 }}><Btn outline label="Voltar" onPress={() => setStep(0)} style={{ flex: 1 }} /><Btn label="Continuar" icon="arrow-forward" onPress={() => setStep(2)} style={{ flex: 2 }} /></View>
        </>
      )}
      {step === 2 && (
        <>
          <T size={56} center>🔔</T>
          <H1 style={{ textAlign: 'center' }}>Ativar notificações</H1>
          <Card>
            <T style={{ lineHeight: 22 }}>As notificações são o coração do app: elas tocam <T weight="black">mesmo com o app fechado</T> para avisar:{'\n'}
              🏀 alarme do basquete às 13:00 (e aviso às 12:45){'\n'}🎧 fone para carregar e “pegou o fone?”{'\n'}💧 hora de beber água{'\n'}😴 hora de dormir</T>
          </Card>
          {granted === false && (<><T color={t.danger} size={13}>Permissão negada. Você pode ativar nas configurações do celular e o app continua funcionando sem avisos.</T><Btn outline label="Abrir configurações do celular" onPress={() => Linking.openSettings()} /></>)}
          <Btn label={granted ? 'Notificações ativadas ✓' : 'Permitir notificações'} icon="notifications" onPress={async () => setGranted(await requestPermission())} />
          <Btn label="Começar!" icon="rocket" color={t.green} onPress={finish} />
          <Btn outline small label="Agora não — entrar sem notificações" onPress={finish} color={t.sub} />
        </>
      )}
    </Screen>
  );
}
