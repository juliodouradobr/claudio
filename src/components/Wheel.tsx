import React, { useRef, useState } from 'react';
import { Animated, Easing, Modal, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { useStore } from '../store';
import { WHEEL } from '../data/game';
import { Btn, H2, T } from './ui';
import { play, haptic } from '../services/sound';
import { FONT } from '../theme';

const R = 130;
export default function Wheel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { A } = useStore();
  const rot = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const n = WHEEL.length, seg = 360 / n;
  const spin = () => {
    const idx = A.spinWheel();
    if (idx < 0) return;
    setSpinning(true); haptic.medium(); play('tick');
    const target = 360 * 6 + (360 - (idx * seg + seg / 2));
    Animated.timing(rot, { toValue: target, duration: 4200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => { setSpinning(false); setDone(true); A.applyWheel(idx); });
  };
  const arc = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    return `M${R} ${R} L${R + R * Math.cos(a0)} ${R + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${R + R * Math.cos(a1)} ${R + R * Math.sin(a1)} Z`;
  };
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000DD', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
        <H2 color="#fff">Roleta da sorte 🎡</H2>
        <T color="#FFFFFFAA" size={13} center>Você cumpriu a rotina a semana toda!</T>
        <View style={{ width: R * 2, height: R * 2 + 24, alignItems: 'center' }}>
          <T size={30} style={{ zIndex: 5 }}>🔻</T>
          <Animated.View style={{ transform: [{ rotate: rot.interpolate({ inputRange: [0, 3600], outputRange: ['0deg', '3600deg'] }) }] }}>
            <Svg width={R * 2} height={R * 2}>
              {WHEEL.map((w, i) => (
                <G key={i}>
                  <Path d={arc(i)} fill={w.color} stroke="#0F1115" strokeWidth={3} />
                  <SvgText x={R} y={22} fill="#0F1115" fontSize={13} fontFamily={FONT.black} textAnchor="middle" transform={`rotate(${i * seg + seg / 2} ${R} ${R})`}>{w.label}</SvgText>
                </G>
              ))}
            </Svg>
          </Animated.View>
        </View>
        {!done ? <Btn label={spinning ? 'Girando...' : 'GIRAR!'} onPress={spin} disabled={spinning} big style={{ alignSelf: 'stretch' }} /> : <Btn label="Fechar" onPress={() => { setDone(false); onClose(); }} style={{ alignSelf: 'stretch' }} />}
        {!spinning && !done && <T color="#FFFFFF88" size={12} onPress={onClose}>Agora não</T>}
      </View>
    </Modal>
  );
}
