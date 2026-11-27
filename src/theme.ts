import { useStore } from './store';
import { equippedValue } from './data/game';

export const ORANGE = '#FF6B1A';
export const GREEN = '#22D3A6';
export const FONT = { reg: 'Inter_400Regular', semi: 'Inter_600SemiBold', bold: 'Inter_700Bold', black: 'Inter_900Black' };

const dark = { dark: true, bg: '#0F1115', bg2: '#171A21', card: 'rgba(255,255,255,0.06)', cardSolid: '#1A1D25', border: 'rgba(255,255,255,0.10)', text: '#F4F6FA', sub: '#9AA3B2', shadow: '#000', blur: 'dark' as const };
const light = { dark: false, bg: '#F2F4F8', bg2: '#FFFFFF', card: 'rgba(255,255,255,0.75)', cardSolid: '#FFFFFF', border: 'rgba(15,17,21,0.08)', text: '#12151B', sub: '#5E6677', shadow: '#5B6478', blur: 'light' as const };

export function useTheme() {
  const { s } = useStore();
  const base = s.settings.theme === 'light' ? light : dark;
  const accent = equippedValue(s, 'theme');
  return { ...base, accent, green: GREEN, accentSoft: accent + '26', danger: '#FF4D4D', gold: '#FFC83D' };
}
export type Theme = ReturnType<typeof useTheme>;
