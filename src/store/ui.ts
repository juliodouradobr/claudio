import { Rarity } from '../types';
export type UIEvent =
  | { t: 'bubble'; text: string }
  | { t: 'celebrate' }
  | { t: 'levelup'; level: number }
  | { t: 'chest'; rarity: Rarity; title: string; lines: string[] }
  | { t: 'float'; text: string };
const listeners = new Set<(e: UIEvent) => void>();
export const ui = {
  on(fn: (e: UIEvent) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  emit(e: UIEvent) { listeners.forEach((l) => l(e)); },
  bubble(text: string) { if (text) this.emit({ t: 'bubble', text }); },
  celebrate() { this.emit({ t: 'celebrate' }); },
  float(text: string) { this.emit({ t: 'float', text }); },
};
