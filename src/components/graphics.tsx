import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGrad, Path, Polygon, Polyline, Rect, Stop, Text as SvgText, Line, Ellipse } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarCfg, State } from '../types';
import { ATTR_META, attributes, equippedValue, levelFromXp, titleOf } from '../data/game';
import { FONT, useTheme } from '../theme';
import { T } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const Ring = ({ pct, size = 150, stroke = 14, color, children }: { pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) => {
  const t = useTheme();
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: Math.max(0, Math.min(1, pct)), duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [pct, v]);
  const col = color ?? t.accent;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs><SvgGrad id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={col} /><Stop offset="1" stopColor={t.green} /></SvgGrad></Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke="url(#rg)" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${c}`} strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [c, 0] }) as unknown as number} />
      </Svg>
      {children}
    </View>
  );
};

export const Radar = ({ values, size = 220, color }: { values: number[]; size?: number; color?: string }) => {
  const t = useTheme();
  const c = size / 2, R = size / 2 - 38, n = values.length;
  const pt = (i: number, k: number) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [c + Math.cos(a) * R * k, c + Math.sin(a) * R * k] as const; };
  const poly = (k: number) => Array.from({ length: n }, (_, i) => pt(i, k).join(',')).join(' ');
  const col = color ?? t.accent;
  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((k) => <Polygon key={k} points={poly(k)} fill="none" stroke={t.border} strokeWidth={1} />)}
      {values.map((_, i) => <Line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke={t.border} />)}
      <Polygon points={values.map((v, i) => pt(i, Math.max(0.08, v / 99)).join(',')).join(' ')} fill={col + '55'} stroke={col} strokeWidth={2.5} />
      {values.map((v, i) => { const [x, y] = pt(i, Math.max(0.08, v / 99)); return <Circle key={i} cx={x} cy={y} r={4} fill={col} />; })}
      {ATTR_META.slice(0, n).map((m, i) => { const [x, y] = pt(i, 1.28); return <SvgText key={m.id} x={x} y={y + 4} fill={t.text} fontSize={11} fontFamily={FONT.bold} textAnchor="middle">{m.emoji} {values[i]}</SvgText>; })}
    </Svg>
  );
};

export const LineChart = ({ data, labels, height = 150, color, suffix = '', invert, min, max }: { data: number[]; labels?: string[]; height?: number; color?: string; suffix?: string; invert?: boolean; min?: number; max?: number }) => {
  const t = useTheme();
  const [w, setW] = useState(300);
  const col = color ?? t.accent;
  if (data.length === 0) return <View style={{ height, alignItems: 'center', justifyContent: 'center' }}><T color={t.sub} size={13}>Sem dados ainda — treine para ver o gráfico 📈</T></View>;
  const lo = min ?? Math.min(...data), hi = max ?? Math.max(...data);
  const span = hi - lo || 1, pad = 18, H = height - 26;
  const x = (i: number) => pad + (data.length === 1 ? (w - pad * 2) / 2 : (i * (w - pad * 2)) / (data.length - 1));
  const y = (v: number) => { const k = (v - lo) / span; return 10 + (invert ? k : 1 - k) * (H - 20); };
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
      <Svg width={w} height={height}>
        <Defs><SvgGrad id="ar" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={col} stopOpacity={0.35} /><Stop offset="1" stopColor={col} stopOpacity={0} /></SvgGrad></Defs>
        {[0, 0.5, 1].map((k) => <Line key={k} x1={pad} x2={w - pad} y1={10 + k * (H - 20)} y2={10 + k * (H - 20)} stroke={t.border} strokeDasharray="4 6" />)}
        {data.length > 1 && <Polygon points={`${x(0)},${H} ${pts} ${x(data.length - 1)},${H}`} fill="url(#ar)" />}
        {data.length > 1 && <Polyline points={pts} fill="none" stroke={col} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
        {data.map((v, i) => (
          <G key={i}>
            <Circle cx={x(i)} cy={y(v)} r={5} fill={t.bg} stroke={col} strokeWidth={3} />
            {(data.length <= 8 || i === data.length - 1) && <SvgText x={x(i)} y={y(v) - 10} fill={t.text} fontSize={10} fontFamily={FONT.bold} textAnchor="middle">{Math.round(v * 10) / 10}{suffix}</SvgText>}
            {labels && (data.length <= 8 || i % 2 === 0) && <SvgText x={x(i)} y={height - 6} fill={t.sub} fontSize={10} fontFamily={FONT.semi} textAnchor="middle">{labels[i]}</SvgText>}
          </G>
        ))}
      </Svg>
    </View>
  );
};

export const BarChart = ({ data, labels, height = 120, color }: { data: number[]; labels: string[]; height?: number; color?: string }) => {
  const t = useTheme();
  const max = Math.max(1, ...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height, gap: 6 }}>
      {data.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <T size={10} weight="bold" color={t.sub}>{v || ''}</T>
          <View style={{ width: '100%', height: Math.max(4, (v / max) * (height - 40)), borderRadius: 8, backgroundColor: v ? color ?? t.accent : t.border }} />
          <T size={10} weight="semi" color={t.sub}>{labels[i]}</T>
        </View>
      ))}
    </View>
  );
};

// ---------------- Avatar ----------------
export const SKINS = ['#FFDBB4', '#E8B98A', '#C68642', '#8D5524', '#5C3A21'];
export const HAIR_COLORS = ['#1B1B1F', '#4A2C14', '#B5651D', '#E8C547', '#E5202E', '#7B4DFF'];
export const HAIR_STYLES = ['Baixinho', 'Black', 'Moicano', 'Longo', 'Careca', 'Trancinhas'];

export const Avatar = ({ cfg, equipped, size = 160, ball = true, number = '23' }: { cfg: AvatarCfg; equipped: State['equipped']; size?: number; ball?: boolean; number?: string }) => {
  const jersey = equippedValue({ equipped }, 'jersey'), shoes = equippedValue({ equipped }, 'shoes'), ballC = equippedValue({ equipped }, 'ball'), acc = equippedValue({ equipped }, 'accessory');
  const skin = cfg.skin, hair = cfg.hairColor;
  return (
    <Svg width={size} height={(size * 260) / 200} viewBox="0 0 200 260">
      <Ellipse cx="100" cy="248" rx="62" ry="8" fill="#00000033" />
      {/* pernas */}
      <Rect x="76" y="170" width="19" height="64" rx="9" fill={skin} /><Rect x="105" y="170" width="19" height="64" rx="9" fill={skin} />
      {/* tênis */}
      <Path d="M68 232 Q68 222 80 222 L96 222 L96 242 L66 242 Q64 236 68 232Z" fill={shoes} stroke="#00000033" strokeWidth="1.5" />
      <Path d="M132 232 Q132 222 120 222 L104 222 L104 242 L134 242 Q136 236 132 232Z" fill={shoes} stroke="#00000033" strokeWidth="1.5" />
      <Rect x="70" y="238" width="26" height="4" rx="2" fill="#FFFFFF99" /><Rect x="104" y="238" width="26" height="4" rx="2" fill="#FFFFFF99" />
      {/* shorts */}
      <Path d="M68 150 L132 150 L138 204 L104 204 L100 178 L96 204 L62 204 Z" fill={jersey} /><Path d="M68 150 L132 150 L133 158 L67 158Z" fill="#00000026" />
      {/* braços */}
      <Rect x="46" y="98" width="19" height="60" rx="9.5" fill={skin} transform="rotate(8 55 100)" /><Rect x="135" y="98" width="19" height="60" rx="9.5" fill={skin} transform="rotate(-8 145 100)" />
      {/* camisa */}
      <Path d="M62 100 Q70 90 86 88 L114 88 Q130 90 138 100 L142 156 L58 156 Z" fill={jersey} />
      <Path d="M86 88 Q100 104 114 88" fill={skin} /><Path d="M62 100 Q70 90 86 88 L78 108 L60 112Z" fill="#00000022" />
      <SvgText x="100" y="138" fontSize="30" fontFamily={FONT.black} fill="#FFFFFFEE" textAnchor="middle">{number}</SvgText>
      {/* pescoço e cabeça */}
      <Rect x="91" y="76" width="18" height="16" rx="6" fill={skin} />
      <Circle cx="100" cy="58" r="27" fill={skin} /><Circle cx="73" cy="60" r="5" fill={skin} /><Circle cx="127" cy="60" r="5" fill={skin} />
      {/* cabelo */}
      {cfg.hair === 0 && <Path d="M73 52 Q74 28 100 28 Q126 28 127 52 Q112 40 100 42 Q86 40 73 52Z" fill={hair} />}
      {cfg.hair === 1 && <G><Circle cx="100" cy="38" r="31" fill={hair} /><Circle cx="100" cy="62" r="25" fill={skin} /></G>}
      {cfg.hair === 2 && <Path d="M93 26 L107 26 L110 50 L90 50Z" fill={hair} />}
      {cfg.hair === 3 && <Path d="M72 58 Q68 24 100 26 Q132 24 128 58 L128 86 L118 86 L118 52 Q100 40 82 52 L82 86 L72 86Z" fill={hair} />}
      {cfg.hair === 5 && <G><Path d="M73 52 Q74 28 100 28 Q126 28 127 52 Q112 40 100 42 Q86 40 73 52Z" fill={hair} />{[76, 86, 114, 124].map((x) => <Rect key={x} x={x - 3} y="48" width="6" height="40" rx="3" fill={hair} />)}</G>}
      {/* rosto */}
      <Circle cx="89" cy="60" r="3.2" fill="#1B1B1F" /><Circle cx="111" cy="60" r="3.2" fill="#1B1B1F" />
      <Path d="M90 71 Q100 80 110 71" stroke="#1B1B1F" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* acessórios */}
      {acc === 'headband' && <Rect x="73" y="42" width="54" height="8" rx="4" fill="#FF4D4D" />}
      {acc === 'glasses' && <G><Rect x="80" y="54" width="18" height="12" rx="5" fill="#111" /><Rect x="102" y="54" width="18" height="12" rx="5" fill="#111" /><Rect x="98" y="58" width="4" height="3" fill="#111" /></G>}
      {acc === 'cap' && <G><Path d="M72 48 Q74 26 100 26 Q126 26 128 48Z" fill="#E5202E" /><Rect x="96" y="44" width="48" height="7" rx="3.5" fill="#B5121E" /></G>}
      {acc === 'chain' && <Path d="M82 92 Q100 118 118 92" stroke="#FFC83D" strokeWidth="4" fill="none" strokeLinecap="round" />}
      {acc === 'wristband' && <G><Rect x="46" y="140" width="19" height="9" rx="4" fill="#FFFFFF" transform="rotate(8 55 100)" /></G>}
      {acc === 'crown' && <Path d="M76 34 L82 14 L92 28 L100 10 L108 28 L118 14 L124 34Z" fill="#FFC83D" stroke="#E0A800" strokeWidth="2" />}
      {/* bola */}
      {ball && <G><Circle cx="164" cy="214" r="19" fill={ballC} stroke="#00000044" strokeWidth="1.5" /><Path d="M145 214 H183 M164 195 V233 M151 201 Q164 214 151 227 M177 201 Q164 214 177 227" stroke="#00000066" strokeWidth="1.6" fill="none" /></G>}
    </Svg>
  );
};

// ---------------- Quadra de fundo ----------------
export const COURTS: Record<string, { colors: [string, string]; floor: string; lines: string; label: string }> = {
  street: { colors: ['#2B3140', '#10131A'], floor: '#4A4F5C', lines: '#FFFFFF55', label: 'Rua' },
  gym: { colors: ['#3B2A16', '#17100A'], floor: '#C98A4B', lines: '#FFFFFFAA', label: 'Ginásio' },
  beach: { colors: ['#58C2F5', '#BDE9FF'], floor: '#EBCB8B', lines: '#FFFFFF99', label: 'Praia' },
  nba: { colors: ['#1B2A5C', '#0A1030'], floor: '#E0A55E', lines: '#FFFFFFCC', label: 'NBA' },
};
export const CourtBg = ({ id, height = 180, radius = 24, children }: { id: string; height?: number; radius?: number; children?: React.ReactNode }) => {
  const c = COURTS[id] ?? COURTS.street;
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
      <LinearGradient colors={c.colors} style={{ position: 'absolute', inset: 0 }} />
      {id === 'nba' && <View style={{ position: 'absolute', top: 14, flexDirection: 'row', gap: 6 }}>{Array.from({ length: 14 }).map((_, i) => <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ['#FFC83D', '#FF4D8D', '#22D3A6', '#3B9BFF'][i % 4], opacity: 0.8 }} />)}</View>}
      {id === 'beach' && <View style={{ position: 'absolute', top: 16, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFE066' }} />}
      <Svg width="100%" height={height * 0.38} viewBox="0 0 300 70" preserveAspectRatio="none">
        <Rect x="0" y="0" width="300" height="70" fill={c.floor} />
        <Path d="M0 0 H300" stroke={c.lines} strokeWidth="3" />
        <Path d="M110 70 L125 0 M190 70 L175 0" stroke={c.lines} strokeWidth="3" />
        <Circle cx="150" cy="0" r="30" stroke={c.lines} strokeWidth="3" fill="none" />
      </Svg>
      <View style={{ position: 'absolute', bottom: 0, alignItems: 'center' }}>{children}</View>
    </View>
  );
};

// ---------------- Carta de jogador ----------------
export const PlayerCard = ({ s, name, level, overall, attrs, avatar, equipped, compact }: { s?: State; name: string; level: number; overall: number; attrs: Record<string, number>; avatar: AvatarCfg; equipped: State['equipped']; compact?: boolean }) => {
  void s;
  const tier = overall >= 85 ? { c: ['#FFE98A', '#C8921B'], tx: '#3A2A00' } : overall >= 70 ? { c: ['#F4D58B', '#B58532'], tx: '#3A2A00' } : overall >= 55 ? { c: ['#E3E8F0', '#8E98A8'], tx: '#1B2230' } : { c: ['#E0A070', '#8A4F24'], tx: '#2B1606' };
  const w = compact ? 200 : 270;
  return (
    <LinearGradient colors={tier.c as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: w, borderRadius: 28, padding: 16, alignSelf: 'center', shadowColor: tier.c[1], shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 60 }}>
          <T size={compact ? 34 : 44} weight="black" color={tier.tx} style={{ lineHeight: compact ? 38 : 48 }}>{overall}</T>
          <T size={11} weight="black" color={tier.tx}>NOTA</T>
          <T size={22} style={{ marginTop: 4 }}>🏀</T>
          <T size={10} weight="black" color={tier.tx}>NV {level}</T>
        </View>
        <View style={{ flex: 1, alignItems: 'center', marginTop: -4 }}><Avatar cfg={avatar} equipped={equipped} size={compact ? 90 : 120} ball={false} /></View>
      </View>
      <T size={compact ? 16 : 20} weight="black" color={tier.tx} center style={{ marginTop: 4, textTransform: 'uppercase' }} numberOfLines={1}>{name}</T>
      <T size={11} weight="bold" color={tier.tx} center>{titleOf(level)}</T>
      <View style={{ height: 2, backgroundColor: tier.tx + '33', marginVertical: 8 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ATTR_META.map((m) => (
          <View key={m.id} style={{ width: '50%', flexDirection: 'row', gap: 6, paddingVertical: 2, justifyContent: 'center' }}>
            <T size={14} weight="black" color={tier.tx}>{attrs[m.id]}</T><T size={11} weight="bold" color={tier.tx}>{m.short}</T>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};
export const useMyCard = (s: State) => { const { attrs, overall } = attributes(s); return { attrs, overall, level: levelFromXp(s.xp).level }; };
