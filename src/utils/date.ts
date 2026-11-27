export const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};
export const addDays = (k: string, n: number) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};
export const monthKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
/** Segunda-feira da semana (chave de data) */
export const weekStart = (k: string = dateKey()) => {
  const d = parseKey(k);
  const wd = (d.getDay() + 6) % 7; // seg=0
  d.setDate(d.getDate() - wd);
  return dateKey(d);
};
export const weekDays = (k: string = dateKey()) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(k), i));
export const isWeekend = (d: Date = new Date()) => d.getDay() === 0 || d.getDay() === 6;
export const hhmm = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
};
export const minutesOf = (s: string) => {
  const { h, m } = hhmm(s);
  return h * 60 + m;
};
export const fmtClock = (sec: number) => {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
export const fmtMs = (ms: number) => {
  const t = Math.max(0, ms), m = Math.floor(t / 60000), s = Math.floor((t % 60000) / 1000), c = Math.floor((t % 1000) / 10);
  return `${pad(m)}:${pad(s)}.${pad(c)}`;
};
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const diaNome = (d: Date = new Date()) => DIAS[d.getDay()];
export const mesNome = (m: number) => MESES[m];
export const fmtLong = (d: Date = new Date()) => `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
export const dayOfYear = (d: Date = new Date()) => Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
export const diffDays = (a: string, b: string) => Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / 86400000);

// RNG determinístico (para loja e missões do dia)
export const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
export const rng = (seed: string) => {
  let a = hashStr(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
