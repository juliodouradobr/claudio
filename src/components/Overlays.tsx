import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ui, UIEvent } from '../store/ui';
import { useStore } from '../store';
import { equippedValue, RARITY, titleOf } from '../data/game';
import { Rarity } from '../types';
import { useTheme } from '../theme';
import { Btn, T } from './ui';
import { haptic, play } from '../services/sound';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#FF6B1A', '#22D3A6', '#FFC83D', '#3B9BFF', '#FF4D8D', '#B14DFF'];

// ---------- partículas de comemoração ----------
function Particles({ effect, onDone }: { effect: string; onDone: () => void }) {
  const N = effect === 'confetti' ? 44 : effect === 'fireworks' ? 42 : 22;
  const items = useMemo(() => Array.from({ length: N }, (_, i) => {
    const burst = i % 3;
    return { v: new Animated.Value(0), x: Math.random() * W, delay: Math.random() * 500, rot: Math.random() * 720 - 360, color: COLORS[i % COLORS.length], size: 8 + Math.random() * 8, ang: Math.random() * Math.PI * 2, dist: 70 + Math.random() * 90, cx: W * (0.25 + burst * 0.25), cy: H * (0.25 + (burst % 2) * 0.12) };
  }), [N, effect]);
  const flash = useRef(new Animated.Value(0)).current;
  const cb = useRef(onDone); cb.current = onDone;
  useEffect(() => {
    const anims = items.map((p) => Animated.timing(p.v, { toValue: 1, duration: 1800 + Math.random() * 600, delay: p.delay, easing: effect === 'fireworks' ? Easing.out(Easing.cubic) : Easing.linear, useNativeDriver: true }));
    if (effect === 'lightning') Animated.sequence([Animated.timing(flash, { toValue: 0.8, duration: 80, useNativeDriver: true }), Animated.timing(flash, { toValue: 0, duration: 200, useNativeDriver: true }), Animated.timing(flash, { toValue: 0.5, duration: 80, useNativeDriver: true }), Animated.timing(flash, { toValue: 0, duration: 400, useNativeDriver: true })]).start();
    Animated.parallel(anims).start(() => cb.current());
  }, [items, effect, flash]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {effect === 'lightning' && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF7B0', opacity: flash }]} />}
      {items.map((p, i) => {
        if (effect === 'confetti') return <Animated.View key={i} style={{ position: 'absolute', left: p.x, top: -20, width: p.size, height: p.size * 1.6, backgroundColor: p.color, borderRadius: 2, opacity: p.v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, H + 40] }) }, { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) }, { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.random() - 0.5) * 80] }) }] }} />;
        if (effect === 'fireworks') return <Animated.View key={i} style={{ position: 'absolute', left: p.cx, top: p.cy, width: 10, height: 10, borderRadius: 5, backgroundColor: p.color, opacity: p.v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }), transform: [{ translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.ang) * p.dist] }) }, { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.ang) * p.dist + 40 * 1] }) }, { scale: p.v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1.4, 0.3] }) }] }} />;
        const emoji = effect === 'fire' ? '🔥' : '⚡';
        return <Animated.Text key={i} style={{ position: 'absolute', left: p.x, bottom: -30, fontSize: 26 + p.size, opacity: p.v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, -(H * (0.5 + Math.random() * 0.5))] }) }, { scale: p.v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }] }}>{emoji}</Animated.Text>;
      })}
    </View>
  );
}

// ---------- balão do assistente ----------
function Bubble({ text, onDone }: { text: string; onDone: () => void }) {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  const cb = useRef(onDone); cb.current = onDone;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      Animated.delay(3600),
      Animated.timing(v, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => cb.current());
  }, [v]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: ins.top + 70, left: 16, right: 16, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: t.dark ? '#242936' : '#FFFFFF', padding: 14, borderRadius: 24, borderTopLeftRadius: 6, borderWidth: 1, borderColor: t.accent + '66', shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}><T size={20}>🧢</T></View>
        <T weight="bold" size={14} style={{ flex: 1 }}>{text}</T>
      </View>
    </Animated.View>
  );
}

function FloatText({ text, onDone }: { text: string; onDone: () => void }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const cb = useRef(onDone); cb.current = onDone;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 1700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => cb.current()); }, [v]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', bottom: 150, opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [30, -70] }) }, { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.15, 1] }) }] }}>
      <View style={{ backgroundColor: t.green, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, shadowColor: t.green, shadowOpacity: 0.6, shadowRadius: 14, elevation: 10 }}><T weight="black" size={16} color="#0F1115">{text}</T></View>
    </Animated.View>
  );
}

// ---------- level up ----------
function LevelUp({ level, onClose }: { level: number; onClose: () => void }) {
  const t = useTheme();
  const pop = useRef(new Animated.Value(0)).current, spin = useRef(new Animated.Value(0)).current, num = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    play('levelup'); haptic.burst();
    Animated.sequence([Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 16 }), Animated.spring(num, { toValue: 1, useNativeDriver: true, bounciness: 18 })]).start();
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [pop, spin, num]);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <LinearGradient colors={['#1B0F3A', '#3B1670', t.accent + 'DD']} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Particles effect="confetti" onDone={() => {}} />
        <Animated.View style={{ position: 'absolute', transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          {Array.from({ length: 12 }).map((_, i) => <View key={i} style={{ position: 'absolute', left: -3, top: -230, width: 6, height: 160, backgroundColor: '#FFFFFF22', borderRadius: 3, transform: [{ rotate: `${i * 30}deg` }, { translateY: 0 }], transformOrigin: 'center 230px' }} />)}
        </Animated.View>
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: pop }] }}>
          <T size={20} weight="black" color="#FFD84D" style={{ letterSpacing: 6 }}>LEVEL UP!</T>
          <Animated.View style={{ transform: [{ scale: num.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }], marginVertical: 8 }}>
            <T size={150} weight="black" color="#fff" style={{ textShadowColor: t.accent, textShadowRadius: 30 }}>{level}</T>
          </Animated.View>
          <T size={26} weight="black" color="#fff">{titleOf(level)}</T>
          <T size={14} color="#FFFFFFCC" center style={{ marginTop: 8 }}>+{level * 10} moedas de bônus 🪙{'\n'}Você está evoluindo na vida real!</T>
        </Animated.View>
        <Btn label="BORA!" onPress={onClose} style={{ position: 'absolute', bottom: 70, left: 40, right: 40 }} color="#FFD84D" big />
      </LinearGradient>
    </Modal>
  );
}

// ---------- baú ----------
function Chest({ ev, onClose }: { ev: Extract<UIEvent, { t: 'chest' }>; onClose: () => void }) {
  const col = RARITY[ev.rarity];
  const shake = useRef(new Animated.Value(0)).current, open = useRef(new Animated.Value(0)).current, glow = useRef(new Animated.Value(0)).current;
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    haptic.medium();
    Animated.sequence([
      Animated.loop(Animated.sequence([Animated.timing(shake, { toValue: 1, duration: 70, useNativeDriver: true }), Animated.timing(shake, { toValue: -1, duration: 70, useNativeDriver: true })]), { iterations: 7 }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      setOpened(true); play('chest'); haptic.success();
      Animated.parallel([Animated.spring(open, { toValue: 1, useNativeDriver: true, bounciness: 14 }), Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: true })]).start();
    });
  }, [shake, open, glow]);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000DD', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {opened && <Particles effect="confetti" onDone={() => {}} />}
        <Animated.View style={{ position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: col.glow, opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.2] }) }] }} />
        <Animated.View style={{ transform: [{ rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] }) }, { scale: open.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }] }}>
          <T size={120}>{opened ? '✨' : '🎁'}</T>
        </Animated.View>
        <Animated.View style={{ alignItems: 'center', opacity: open, transform: [{ translateY: open.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          <T size={14} weight="black" color={col.color} style={{ letterSpacing: 4 }}>{col.label.toUpperCase()}</T>
          <T size={26} weight="black" color="#fff" center style={{ marginTop: 4 }}>{ev.title}</T>
          <View style={{ marginTop: 14, gap: 6, alignItems: 'center' }}>
            {ev.lines.map((l, i) => <T key={i} size={20} weight="black" color={col.color} center>{l}</T>)}
          </View>
        </Animated.View>
        {opened && <Btn label="Show!" onPress={onClose} color={col.color} style={{ position: 'absolute', bottom: 70, left: 50, right: 50 }} />}
      </View>
    </Modal>
  );
}

// ---------- camada global ----------
export default function Overlays() {
  const { s } = useStore();
  const effect = equippedValue(s, 'effect');
  const effectRef = useRef(effect); effectRef.current = effect;
  const [bubbles, setBubbles] = useState<{ id: number; text: string }[]>([]);
  const [floats, setFloats] = useState<{ id: number; text: string }[]>([]);
  const [fx, setFx] = useState<number[]>([]);
  const [level, setLevel] = useState<number | null>(null);
  const [chest, setChest] = useState<Extract<UIEvent, { t: 'chest' }> | null>(null);
  const id = useRef(0);

  useEffect(() => ui.on((e) => {
    const n = ++id.current;
    if (e.t === 'bubble') setBubbles((b) => [...b.slice(-1), { id: n, text: e.text }]);
    if (e.t === 'float') setFloats((f) => [...f.slice(-1), { id: n, text: e.text }]);
    if (e.t === 'celebrate') setFx((f) => [...f, n]);
    if (e.t === 'levelup') setTimeout(() => setLevel(e.level), 1400);
    if (e.t === 'chest') setChest(e);
  }), []);
  const rmB = useCallback((i: number) => setBubbles((b) => b.filter((x) => x.id !== i)), []);
  const rmF = useCallback((i: number) => setFloats((b) => b.filter((x) => x.id !== i)), []);
  const rmFx = useCallback((i: number) => setFx((b) => b.filter((x) => x !== i)), []);
  return (
    <>
      {fx.map((i) => <Particles key={i} effect={effectRef.current} onDone={() => rmFx(i)} />)}
      {bubbles.slice(-1).map((b) => <Bubble key={b.id} text={b.text} onDone={() => rmB(b.id)} />)}
      {floats.slice(-1).map((f) => <FloatText key={f.id} text={f.text} onDone={() => rmF(f.id)} />)}
      {level !== null && <LevelUp level={level} onClose={() => setLevel(null)} />}
      {chest && <Chest ev={chest} onClose={() => setChest(null)} />}
    </>
  );
}
export type { Rarity };
