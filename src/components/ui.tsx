import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, useTheme } from '../theme';
import { haptic, play } from '../services/sound';

type IconName = keyof typeof Ionicons.glyphMap;
export { Ionicons };
export type { IconName };

export const Card = ({ children, style, pad = 16, glow }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: number; glow?: string }) => {
  const t = useTheme();
  const inner = { padding: pad };
  const base: ViewStyle = { borderRadius: 26, borderWidth: 1, borderColor: glow ?? t.border, overflow: 'hidden', shadowColor: glow ?? t.shadow, shadowOpacity: glow ? 0.5 : t.dark ? 0.35 : 0.12, shadowRadius: glow ? 16 : 14, shadowOffset: { width: 0, height: 8 }, elevation: glow ? 8 : 4 };
  if (Platform.OS === 'ios') {
    return (
      <View style={[base, style]}>
        <BlurView intensity={t.dark ? 28 : 40} tint={t.blur} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.card }]} />
        <View style={inner}>{children}</View>
      </View>
    );
  }
  return <View style={[base, { backgroundColor: t.dark ? '#1A1D25' : '#FFFFFF' }, style]}><View style={[StyleSheet.absoluteFill, { backgroundColor: t.card }]} /><View style={inner}>{children}</View></View>;
};

export const T = ({ children, style, size = 15, color, weight = 'reg', numberOfLines, center, onPress }: { children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number; color?: string; weight?: 'reg' | 'semi' | 'bold' | 'black'; numberOfLines?: number; center?: boolean; onPress?: () => void }) => {
  const t = useTheme();
  return <Text onPress={onPress} numberOfLines={numberOfLines} style={[{ fontFamily: FONT[weight], fontSize: size, color: color ?? t.text, textAlign: center ? 'center' : undefined }, style]}>{children}</Text>;
};
export const H1 = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => <T size={32} weight="black" style={[{ letterSpacing: -0.8 }, style]}>{children}</T>;
export const H2 = ({ children, style, color }: { children: React.ReactNode; style?: StyleProp<TextStyle>; color?: string }) => <T size={20} weight="black" color={color} style={[{ letterSpacing: -0.3 }, style]}>{children}</T>;

export const Btn = ({ label, onPress, icon, color, style, big, disabled, outline, textColor, small }: { label: string; onPress: () => void; icon?: IconName; color?: string; style?: StyleProp<ViewStyle>; big?: boolean; disabled?: boolean; outline?: boolean; textColor?: string; small?: boolean }) => {
  const t = useTheme();
  const c = color ?? t.accent;
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }], opacity: disabled ? 0.45 : 1 }, style]}>
      <Pressable disabled={disabled} onPressIn={() => press(0.96)} onPressOut={() => press(1)} onPress={() => { haptic.light(); onPress(); }}>
        {outline ? (
          <View style={[styles.btn, small && styles.btnSmall, big && styles.btnBig, { borderWidth: 2, borderColor: c }]}>
            {icon && <Ionicons name={icon} size={big ? 26 : 18} color={c} />}
            <T weight="bold" size={big ? 20 : small ? 13 : 16} color={c}>{label}</T>
          </View>
        ) : (
          <LinearGradient colors={[c, c + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, small && styles.btnSmall, big && styles.btnBig, { shadowColor: c, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }]}>
            {icon && <Ionicons name={icon} size={big ? 26 : 18} color={textColor ?? '#0F1115'} />}
            <T weight="black" size={big ? 22 : small ? 13 : 16} color={textColor ?? '#0F1115'}>{label}</T>
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const Chip = ({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) => {
  const t = useTheme();
  const c = color ?? t.accent;
  return (
    <Pressable onPress={() => { haptic.light(); onPress?.(); }} style={[styles.chip, { backgroundColor: active ? c : t.card, borderColor: active ? c : t.border }]}>
      <T weight="bold" size={13} color={active ? '#0F1115' : t.text}>{label}</T>
    </Pressable>
  );
};

export const Bar = ({ pct, color, height = 10, bg }: { pct: number; color?: string; height?: number; bg?: string }) => {
  const t = useTheme();
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(w, { toValue: Math.max(0, Math.min(1, pct)), duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [pct, w]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: bg ?? (t.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'), overflow: 'hidden' }}>
      <Animated.View style={{ height, borderRadius: height, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color ?? t.accent }} />
    </View>
  );
};

export const Input = ({ value, onChangeText, placeholder, keyboardType, style, multiline, maxLength, secure }: { value: string; onChangeText: (s: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'number-pad'; style?: StyleProp<TextStyle>; multiline?: boolean; maxLength?: number; secure?: boolean }) => {
  const t = useTheme();
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.sub} keyboardType={keyboardType} multiline={multiline} maxLength={maxLength} secureTextEntry={secure}
    style={[{ fontFamily: FONT.semi, fontSize: 16, color: t.text, backgroundColor: t.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: t.border }, style]} />;
};

/** Seletor de horário simples (HH:MM com + / -) */
export const TimeField = ({ value, onChange, label, step = 15 }: { value: string; onChange: (v: string) => void; label: string; step?: number }) => {
  const t = useTheme();
  const [h, m] = value.split(':').map(Number);
  const set = (total: number) => { total = (total + 1440) % 1440; onChange(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`); };
  const cur = h * 60 + m;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <T weight="semi" style={{ flex: 1 }}>{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable hitSlop={8} onPress={() => { haptic.light(); set(cur - step); }} style={[styles.round, { backgroundColor: t.accentSoft }]}><Ionicons name="remove" size={18} color={t.accent} /></Pressable>
        <T weight="black" size={20} style={{ minWidth: 64, textAlign: 'center' }}>{value}</T>
        <Pressable hitSlop={8} onPress={() => { haptic.light(); set(cur + step); }} style={[styles.round, { backgroundColor: t.accentSoft }]}><Ionicons name="add" size={18} color={t.accent} /></Pressable>
      </View>
    </View>
  );
};

export const Toggle = ({ label, value, onChange, sub }: { label: string; value: boolean; onChange: (v: boolean) => void; sub?: string }) => {
  const t = useTheme();
  return (
    <Pressable onPress={() => { haptic.light(); onChange(!value); }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 }}>
      <View style={{ flex: 1 }}><T weight="semi">{label}</T>{sub ? <T size={12} color={t.sub}>{sub}</T> : null}</View>
      <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: value ? t.accent : t.dark ? '#2B2F3A' : '#CBD1DC', padding: 3, justifyContent: 'center' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: value ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
};

export const Screen = ({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) => {
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const body = <View style={[{ padding: 18, paddingBottom: 130, gap: 16 }, style]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <LinearGradient colors={[t.accent + (t.dark ? '22' : '18'), 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }} />
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: ins.bottom }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{body}</ScrollView> : body}
    </View>
  );
};

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>;

export const Check = ({ done, size = 28, color }: { done: boolean; size?: number; color?: string }) => {
  const t = useTheme();
  const sc = useRef(new Animated.Value(done ? 1 : 0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (done) { play('tick'); Animated.sequence([Animated.timing(sc, { toValue: 1.35, duration: 140, useNativeDriver: true }), Animated.spring(sc, { toValue: 1, useNativeDriver: true, bounciness: 14 })]).start(); }
    else sc.setValue(0);
  }, [done, sc]);
  const c = color ?? t.green;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: done ? c : t.sub + '88', backgroundColor: done ? c : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ scale: sc }], opacity: done ? 1 : 0 }}><Ionicons name="checkmark" size={size * 0.65} color="#0F1115" /></Animated.View>
    </View>
  );
};

export const Pulse = ({ children, active = true }: { children: React.ReactNode; active?: boolean }) => {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) { v.setValue(1); return; }
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1.06, duration: 700, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [active, v]);
  return <Animated.View style={{ transform: [{ scale: v }] }}>{children}</Animated.View>;
};

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 20 },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 14 },
  btnBig: { paddingVertical: 26, borderRadius: 32 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  round: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
