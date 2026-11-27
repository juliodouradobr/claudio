import { Rarity, Slot, State, DayLog } from '../types';
import { dateKey, hashStr, rng, addDays, weekStart, monthKey, weekDays } from '../utils/date';

// ---------- Níveis / XP ----------
export const MAX_LEVEL = 100;
/** XP necessário para ir do nível n para n+1 (calibrado: ~4-5 níveis na 1ª semana, depois mais difícil) */
export const xpToNext = (n: number) => Math.round(170 + 50 * Math.pow(n - 1, 1.25));
export const levelFromXp = (xp: number) => {
  let lvl = 1, rest = xp;
  while (lvl < MAX_LEVEL && rest >= xpToNext(lvl)) { rest -= xpToNext(lvl); lvl++; }
  return { level: lvl, into: lvl >= MAX_LEVEL ? 0 : rest, need: lvl >= MAX_LEVEL ? 1 : xpToNext(lvl) };
};
export const TITLES: [number, string][] = [[1, 'Novato'], [10, 'Amador'], [20, 'Titular'], [35, 'Destaque'], [50, 'Estrela'], [75, 'Lenda'], [100, 'GOAT 🐐']];
export const titleOf = (lvl: number) => [...TITLES].reverse().find(([l]) => lvl >= l)![1];
export const multiplier = (streak: number) => (streak >= 30 ? 2 : streak >= 7 ? 1.5 : streak >= 3 ? 1.2 : 1);

export const XP = { workout: 50, run: 80, basket: 150, checklist: 10, water: 20, sleep: 30 };
export const TASKS: { id: keyof DayLog['tasks']; label: string; xp: number; emoji: string; tab?: string }[] = [
  { id: 'workout', label: 'Exercícios em casa', xp: XP.workout, emoji: '💪', tab: 'Treinos' },
  { id: 'run', label: 'Corrida de 5 voltas', xp: XP.run, emoji: '🏃', tab: 'Corrida' },
  { id: 'basket', label: 'Treino de basquete (2h)', xp: XP.basket, emoji: '🏀', tab: 'Basquete' },
  { id: 'checklist', label: 'Fone e mochila prontos', xp: XP.checklist, emoji: '🎒' },
  { id: 'water', label: 'Meta de água', xp: XP.water, emoji: '💧' },
  { id: 'sleep', label: 'Dormir no horário', xp: XP.sleep, emoji: '😴' },
];

export const emptyDay = (): DayLog => ({
  tasks: {}, water: 0, checks: [], shots: { ft: [0, 0], mid: [0, 0], three: [0, 0] }, reps: { push: 0, squat: 0, situp: 0, other: 0 },
  laps: 0, minutes: 0, workouts: 0, xp: 0, done: false,
});
export const dayOf = (s: State, k: string): DayLog => s.days[k] ?? emptyDay();

/** Tarefas ativas no dia (checklist do fone só em dias de aula e fora de férias) */
export const activeTasks = (s: State, k: string) => {
  const wd = new Date(k + 'T12:00:00').getDay();
  const school = wd >= 1 && wd <= 5 && !s.settings.vacation;
  return TASKS.filter((t) => t.id !== 'checklist' || school);
};
export const dayProgress = (s: State, k: string) => {
  const list = activeTasks(s, k), d = dayOf(s, k);
  const done = list.filter((t) => d.tasks[t.id]).length;
  return { done, total: list.length, pct: list.length ? done / list.length : 0 };
};

// ---------- Atributos (0-99) ----------
const cap = (n: number) => Math.max(1, Math.min(99, Math.round(n)));
export function attributes(s: State) {
  const t = s.totals;
  const pct = t.shotsAtt > 0 ? t.shotsMade / t.shotsAtt : 0;
  const recent = Object.keys(s.days).sort().slice(-14);
  let rm = 0, ra = 0;
  recent.forEach((k) => { const sh = s.days[k].shots; [sh.ft, sh.mid, sh.three].forEach((x) => { rm += x[0]; ra += x[1]; }); });
  const recentPct = ra > 10 ? rm / ra : pct;
  const attrs = {
    forca: cap(25 + t.workouts * 3 + t.reps / 40),
    velocidade: cap(25 + t.runs * 3 + t.laps * 0.6 + (t.bestLapMs ? Math.max(0, (120000 - t.bestLapMs) / 2500) : 0)),
    arremesso: cap(25 + recentPct * 50 + Math.min(20, t.shotsAtt / 25)),
    resistencia: cap(25 + t.basket * 4 + t.basketMin / 60 + t.workouts),
    disciplina: cap(25 + s.streak.current * 3 + s.streak.best * 1.5 + t.checklist * 0.7),
    energia: cap(25 + t.water * 2.5 + t.sleep * 2),
  };
  const overall = cap(attrs.forca * 0.15 + attrs.velocidade * 0.15 + attrs.arremesso * 0.25 + attrs.resistencia * 0.2 + attrs.disciplina * 0.15 + attrs.energia * 0.1 + (levelFromXp(s.xp).level - 1) * 0.15);
  return { attrs, overall };
}
export const ATTR_META: { id: keyof ReturnType<typeof attributes>['attrs']; label: string; short: string; emoji: string }[] = [
  { id: 'forca', label: 'Força', short: 'FOR', emoji: '💪' },
  { id: 'velocidade', label: 'Velocidade', short: 'VEL', emoji: '⚡' },
  { id: 'arremesso', label: 'Arremesso', short: 'ARR', emoji: '🎯' },
  { id: 'resistencia', label: 'Resistência', short: 'RES', emoji: '🫀' },
  { id: 'disciplina', label: 'Disciplina', short: 'DIS', emoji: '🧠' },
  { id: 'energia', label: 'Energia', short: 'ENE', emoji: '💧' },
];

// ---------- Raridades / baús ----------
export const RARITY: Record<Rarity, { label: string; color: string; glow: string; coins: [number, number]; xp: number }> = {
  comum: { label: 'Comum', color: '#9AA3B2', glow: '#9AA3B255', coins: [20, 40], xp: 10 },
  raro: { label: 'Raro', color: '#3B9BFF', glow: '#3B9BFF66', coins: [60, 110], xp: 25 },
  epico: { label: 'Épico', color: '#B14DFF', glow: '#B14DFF77', coins: [150, 260], xp: 60 },
  lendario: { label: 'Lendário', color: '#FFC83D', glow: '#FFC83D99', coins: [400, 650], xp: 150 },
};
export interface ChestReward { rarity: Rarity; coins: number; xp: number; shield?: boolean }
export function rollChest(special: boolean): ChestReward {
  const r = Math.random() * 100;
  const rarity: Rarity = r < (special ? 45 : 62) ? 'comum' : r < (special ? 80 : 88) ? 'raro' : r < (special ? 95 : 97.5) ? 'epico' : 'lendario';
  const [a, b] = RARITY[rarity].coins;
  return { rarity, coins: Math.round(a + Math.random() * (b - a)), xp: RARITY[rarity].xp, shield: (rarity === 'lendario' || (rarity === 'epico' && Math.random() < 0.3)) };
}
export const WHEEL = [
  { label: '50 🪙', coins: 50, xp: 0, color: '#FF6B1A' }, { label: '100 XP', coins: 0, xp: 100, color: '#22D3A6' },
  { label: '150 🪙', coins: 150, xp: 0, color: '#3B9BFF' }, { label: '🛡️ Escudo', coins: 0, xp: 0, shield: true, color: '#B14DFF' },
  { label: '300 🪙', coins: 300, xp: 0, color: '#FFC83D' }, { label: '200 XP', coins: 0, xp: 200, color: '#FF4D8D' },
  { label: '75 🪙', coins: 75, xp: 0, color: '#22D3A6' }, { label: '600 🪙', coins: 600, xp: 0, color: '#FF6B1A' },
] as { label: string; coins: number; xp: number; shield?: boolean; color: string }[];

// ---------- Loja ----------
export interface Item { id: string; slot: Slot; name: string; price: number; rarity: Rarity; emoji: string; value: string; free?: boolean }
export const ITEMS: Item[] = [
  // camisas
  { id: 'jersey_basic', slot: 'jersey', name: 'Camisa Laranja', price: 0, rarity: 'comum', emoji: '👕', value: '#FF6B1A', free: true },
  { id: 'jersey_blue', slot: 'jersey', name: 'Camisa Azul', price: 200, rarity: 'comum', emoji: '👕', value: '#2F7BFF' },
  { id: 'jersey_green', slot: 'jersey', name: 'Camisa Energia', price: 250, rarity: 'comum', emoji: '👕', value: '#22D3A6' },
  { id: 'jersey_purple', slot: 'jersey', name: 'Camisa Roxa', price: 700, rarity: 'raro', emoji: '👕', value: '#9B5CFF' },
  { id: 'jersey_red', slot: 'jersey', name: 'Camisa Chicago', price: 900, rarity: 'raro', emoji: '👕', value: '#E5202E' },
  { id: 'jersey_gold', slot: 'jersey', name: 'Camisa Dourada', price: 2500, rarity: 'epico', emoji: '👑', value: '#FFC83D' },
  { id: 'jersey_galaxy', slot: 'jersey', name: 'Camisa Galáxia', price: 6000, rarity: 'lendario', emoji: '🌌', value: '#5B2BFF' },
  // tênis
  { id: 'shoes_basic', slot: 'shoes', name: 'Tênis Branco', price: 0, rarity: 'comum', emoji: '👟', value: '#F2F2F2', free: true },
  { id: 'shoes_black', slot: 'shoes', name: 'Tênis Preto', price: 220, rarity: 'comum', emoji: '👟', value: '#1B1B1F' },
  { id: 'shoes_red', slot: 'shoes', name: 'Tênis Vermelho', price: 800, rarity: 'raro', emoji: '👟', value: '#FF2D3D' },
  { id: 'shoes_neon', slot: 'shoes', name: 'Tênis Neon', price: 1800, rarity: 'epico', emoji: '⚡', value: '#39FF88' },
  { id: 'shoes_gold', slot: 'shoes', name: 'Tênis de Ouro', price: 5500, rarity: 'lendario', emoji: '🏆', value: '#FFD23D' },
  // bolas
  { id: 'ball_basic', slot: 'ball', name: 'Bola Clássica', price: 0, rarity: 'comum', emoji: '🏀', value: '#E8731A', free: true },
  { id: 'ball_blue', slot: 'ball', name: 'Bola Azul', price: 300, rarity: 'comum', emoji: '🏀', value: '#2F7BFF' },
  { id: 'ball_white', slot: 'ball', name: 'Bola Pro Branca', price: 900, rarity: 'raro', emoji: '🏀', value: '#F4F4F4' },
  { id: 'ball_fire', slot: 'ball', name: 'Bola de Fogo', price: 2200, rarity: 'epico', emoji: '🔥', value: '#FF3B1A' },
  { id: 'ball_gold', slot: 'ball', name: 'Bola Lendária', price: 5000, rarity: 'lendario', emoji: '✨', value: '#FFC83D' },
  // acessórios
  { id: 'acc_none', slot: 'accessory', name: 'Sem acessório', price: 0, rarity: 'comum', emoji: '🚫', value: 'none', free: true },
  { id: 'acc_headband', slot: 'accessory', name: 'Faixa na cabeça', price: 180, rarity: 'comum', emoji: '🎽', value: 'headband' },
  { id: 'acc_wrist', slot: 'accessory', name: 'Munhequeira', price: 150, rarity: 'comum', emoji: '⌚', value: 'wristband' },
  { id: 'acc_glasses', slot: 'accessory', name: 'Óculos Estiloso', price: 650, rarity: 'raro', emoji: '🕶️', value: 'glasses' },
  { id: 'acc_cap', slot: 'accessory', name: 'Boné Pro', price: 1200, rarity: 'raro', emoji: '🧢', value: 'cap' },
  { id: 'acc_chain', slot: 'accessory', name: 'Corrente de Ouro', price: 2800, rarity: 'epico', emoji: '⛓️', value: 'chain' },
  { id: 'acc_crown', slot: 'accessory', name: 'Coroa do GOAT', price: 8000, rarity: 'lendario', emoji: '👑', value: 'crown' },
  // temas do app
  { id: 'theme_orange', slot: 'theme', name: 'Laranja Basquete', price: 0, rarity: 'comum', emoji: '🟠', value: '#FF6B1A', free: true },
  { id: 'theme_green', slot: 'theme', name: 'Verde Energia', price: 400, rarity: 'comum', emoji: '🟢', value: '#22D3A6' },
  { id: 'theme_blue', slot: 'theme', name: 'Azul Gelo', price: 600, rarity: 'raro', emoji: '🔵', value: '#3BA7FF' },
  { id: 'theme_pink', slot: 'theme', name: 'Rosa Neon', price: 900, rarity: 'raro', emoji: '🩷', value: '#FF4DA6' },
  { id: 'theme_purple', slot: 'theme', name: 'Roxo Galáxia', price: 2000, rarity: 'epico', emoji: '🟣', value: '#A855F7' },
  { id: 'theme_gold', slot: 'theme', name: 'Ouro Lendário', price: 4500, rarity: 'lendario', emoji: '🟡', value: '#FFC83D' },
  // sons de alarme
  { id: 'alarm_classic', slot: 'alarm', name: 'Alarme Clássico', price: 0, rarity: 'comum', emoji: '⏰', value: 'alarm_classic', free: true },
  { id: 'alarm_arcade', slot: 'alarm', name: 'Alarme Arcade', price: 350, rarity: 'comum', emoji: '🕹️', value: 'alarm_arcade' },
  { id: 'alarm_horn', slot: 'alarm', name: 'Buzina de Ginásio', price: 1000, rarity: 'raro', emoji: '📣', value: 'alarm_horn' },
  { id: 'alarm_zen', slot: 'alarm', name: 'Sino Zen', price: 2300, rarity: 'epico', emoji: '🔔', value: 'alarm_zen' },
  // quadras
  { id: 'court_street', slot: 'court', name: 'Quadra de Rua', price: 0, rarity: 'comum', emoji: '🏙️', value: 'street', free: true },
  { id: 'court_gym', slot: 'court', name: 'Ginásio', price: 600, rarity: 'raro', emoji: '🏟️', value: 'gym' },
  { id: 'court_beach', slot: 'court', name: 'Quadra na Praia', price: 1500, rarity: 'epico', emoji: '🏖️', value: 'beach' },
  { id: 'court_nba', slot: 'court', name: 'Quadra NBA', price: 6500, rarity: 'lendario', emoji: '🏆', value: 'nba' },
  // efeitos de comemoração
  { id: 'effect_confetti', slot: 'effect', name: 'Confete', price: 0, rarity: 'comum', emoji: '🎉', value: 'confetti', free: true },
  { id: 'effect_fireworks', slot: 'effect', name: 'Fogos de artifício', price: 900, rarity: 'raro', emoji: '🎆', value: 'fireworks' },
  { id: 'effect_fire', slot: 'effect', name: 'Chamas', price: 2000, rarity: 'epico', emoji: '🔥', value: 'fire' },
  { id: 'effect_lightning', slot: 'effect', name: 'Raio', price: 4000, rarity: 'lendario', emoji: '⚡', value: 'lightning' },
];
export const SLOT_LABEL: Record<Slot, string> = { jersey: 'Uniformes', shoes: 'Tênis', ball: 'Bolas', accessory: 'Acessórios', theme: 'Temas', alarm: 'Alarmes', court: 'Quadras', effect: 'Efeitos' };
export const itemById = (id: string) => ITEMS.find((i) => i.id === id);
export const DEFAULT_EQUIPPED: Record<string, string> = { jersey: 'jersey_basic', shoes: 'shoes_basic', ball: 'ball_basic', accessory: 'acc_none', theme: 'theme_orange', alarm: 'alarm_classic', court: 'court_street', effect: 'effect_confetti' };
export const equippedValue = (s: Pick<State, 'equipped'>, slot: Slot) => itemById(s.equipped[slot] ?? DEFAULT_EQUIPPED[slot])!.value;

/** Estoque do dia: itens comuns sempre; raro ~55%, épico ~30%, lendário ~12% (muda a cada dia) */
export function shopStock(dayKey: string): Item[] {
  const odds: Record<Rarity, number> = { comum: 1, raro: 0.55, epico: 0.3, lendario: 0.12 };
  return ITEMS.filter((i) => {
    if (i.free) return false;
    const r = rng(dayKey + i.id)();
    return r < odds[i.rarity];
  });
}
export const SHIELD_PRICE = 500;

// ---------- Missões ----------
export type Metric = 'ft' | 'shotsMade' | 'shotsAtt' | 'push' | 'squat' | 'situp' | 'laps' | 'workouts' | 'minutes' | 'water' | 'runs' | 'lap3' | 'basket';
export interface MissionDef { id: string; text: string; metric: Metric; target: number; xp: number; coins: number }
export const DAILY_POOL: MissionDef[] = [
  { id: 'd_ft20', text: 'Acerte 20 lances livres', metric: 'ft', target: 20, xp: 40, coins: 30 },
  { id: 'd_ft10', text: 'Acerte 10 lances livres', metric: 'ft', target: 10, xp: 25, coins: 20 },
  { id: 'd_push30', text: 'Faça 30 flexões', metric: 'push', target: 30, xp: 40, coins: 30 },
  { id: 'd_squat40', text: 'Faça 40 agachamentos', metric: 'squat', target: 40, xp: 40, coins: 30 },
  { id: 'd_situp40', text: 'Faça 40 abdominais', metric: 'situp', target: 40, xp: 40, coins: 30 },
  { id: 'd_lap3', text: 'Corra a 3ª volta em menos de 2 min', metric: 'lap3', target: 120, xp: 50, coins: 40 },
  { id: 'd_laps5', text: 'Complete 5 voltas de corrida', metric: 'laps', target: 5, xp: 40, coins: 30 },
  { id: 'd_shots50', text: 'Registre 50 arremessos', metric: 'shotsAtt', target: 50, xp: 45, coins: 35 },
  { id: 'd_made15', text: 'Acerte 15 arremessos (qualquer tipo)', metric: 'shotsMade', target: 15, xp: 35, coins: 25 },
  { id: 'd_water8', text: 'Beba 8 copos de água', metric: 'water', target: 8, xp: 30, coins: 25 },
  { id: 'd_work', text: 'Complete um treino em casa', metric: 'workouts', target: 1, xp: 35, coins: 30 },
  { id: 'd_min60', text: 'Treine 60 minutos hoje', metric: 'minutes', target: 60, xp: 45, coins: 35 },
];
export const WEEKLY_POOL: MissionDef[] = [
  { id: 'w_ft100', text: 'Acerte 100 lances livres na semana', metric: 'ft', target: 100, xp: 200, coins: 150 },
  { id: 'w_shots300', text: 'Registre 300 arremessos na semana', metric: 'shotsAtt', target: 300, xp: 220, coins: 160 },
  { id: 'w_work4', text: 'Faça 4 treinos em casa na semana', metric: 'workouts', target: 4, xp: 180, coins: 140 },
  { id: 'w_laps20', text: 'Corra 20 voltas na semana', metric: 'laps', target: 20, xp: 200, coins: 150 },
  { id: 'w_basket5', text: 'Faça 5 treinos de basquete completos', metric: 'basket', target: 5, xp: 260, coins: 200 },
  { id: 'w_push150', text: 'Faça 150 flexões na semana', metric: 'push', target: 150, xp: 200, coins: 150 },
];
export const BOSS_POOL: { id: string; name: string; emoji: string; metric: Metric; target: number; xp: number; coins: number }[] = [
  { id: 'boss_shots', name: 'Rei dos Arremessos', emoji: '👹', metric: 'shotsAtt', target: 1000, xp: 800, coins: 700 },
  { id: 'boss_laps', name: 'Dragão da Pista', emoji: '🐲', metric: 'laps', target: 100, xp: 800, coins: 700 },
  { id: 'boss_ft', name: 'Gigante do Lance Livre', emoji: '🗿', metric: 'ft', target: 300, xp: 800, coins: 700 },
];
const pickN = <T,>(arr: T[], n: number, seed: string) => {
  const r = rng(seed), a = [...arr], out: T[] = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]);
  return out;
};
export const dailyMissions = (k: string) => pickN(DAILY_POOL, 3, 'daily' + k);
export const weeklyMissions = (k: string) => pickN(WEEKLY_POOL, 2, 'weekly' + weekStart(k));
export const bossOfMonth = (m: string) => BOSS_POOL[hashStr('boss' + m) % BOSS_POOL.length];

const val = (d: DayLog, m: Metric): number => {
  switch (m) {
    case 'ft': return d.shots.ft[0];
    case 'shotsMade': return d.shots.ft[0] + d.shots.mid[0] + d.shots.three[0];
    case 'shotsAtt': return d.shots.ft[1] + d.shots.mid[1] + d.shots.three[1];
    case 'push': return d.reps.push; case 'squat': return d.reps.squat; case 'situp': return d.reps.situp;
    case 'laps': return d.laps; case 'workouts': return d.workouts; case 'minutes': return d.minutes; case 'water': return d.water;
    case 'runs': return d.tasks.run ? 1 : 0; case 'basket': return d.tasks.basket ? 1 : 0;
    case 'lap3': return d.lap3 ?? 0;
  }
};
export const metricOnDay = (s: State, k: string, m: Metric) => val(dayOf(s, k), m);
export const metricOnWeek = (s: State, k: string, m: Metric) => weekDays(k).reduce((a, d) => a + val(dayOf(s, d), m), 0);
export const metricOnMonth = (s: State, mk: string, m: Metric) => Object.keys(s.days).filter((d) => d.startsWith(mk)).reduce((a, d) => a + val(s.days[d], m), 0);
/** progresso (0..target) de uma missão. lap3 é "menor é melhor" */
export const missionProgress = (s: State, def: MissionDef, k: string, weekly: boolean) => {
  if (def.metric === 'lap3') { const v = metricOnDay(s, k, 'lap3'); return v > 0 && v < def.target ? def.target : 0; }
  return Math.min(def.target, weekly ? metricOnWeek(s, k, def.metric) : metricOnDay(s, k, def.metric));
};

// ---------- Conquistas ----------
export type Tier = 'bronze' | 'prata' | 'ouro' | 'platina';
export const TIER_COLOR: Record<Tier, string> = { bronze: '#CD7F32', prata: '#C0C7D1', ouro: '#FFC83D', platina: '#7FE7FF' };
export interface Achievement { id: string; name: string; desc: string; emoji: string; tier: Tier; secret?: boolean; coins: number; test: (s: State) => boolean }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a_first_run', name: 'Primeira corrida', desc: 'Complete sua primeira corrida de 5 voltas', emoji: '🏃', tier: 'bronze', coins: 50, test: (s) => s.totals.runs >= 1 },
  { id: 'a_first_workout', name: 'Mão na massa', desc: 'Complete o primeiro treino em casa', emoji: '💪', tier: 'bronze', coins: 50, test: (s) => s.totals.workouts >= 1 },
  { id: 'a_first_basket', name: 'Na quadra', desc: 'Complete um treino de basquete de 2h', emoji: '🏀', tier: 'bronze', coins: 80, test: (s) => s.totals.basket >= 1 },
  { id: 'a_streak3', name: 'Pegando ritmo', desc: '3 dias seguidos', emoji: '🔥', tier: 'bronze', coins: 60, test: (s) => s.streak.best >= 3 },
  { id: 'a_streak7', name: '7 dias seguidos', desc: 'Uma semana inteira cumprindo a rotina', emoji: '🔥', tier: 'prata', coins: 150, test: (s) => s.streak.best >= 7 },
  { id: 'a_streak30', name: '30 dias seguidos', desc: 'Um mês de disciplina total', emoji: '🔥', tier: 'ouro', coins: 600, test: (s) => s.streak.best >= 30 },
  { id: 'a_streak100', name: '100 dias seguidos', desc: 'Lenda da constância', emoji: '☄️', tier: 'platina', coins: 3000, test: (s) => s.streak.best >= 100 },
  { id: 'a_ft100', name: '100 lances livres', desc: 'Acerte 100 lances livres no total', emoji: '🎯', tier: 'prata', coins: 150, test: (s) => s.totals.ft >= 100 },
  { id: 'a_ft1000', name: '1000 lances livres', desc: 'Mestre da linha de lance livre', emoji: '🎯', tier: 'ouro', coins: 700, test: (s) => s.totals.ft >= 1000 },
  { id: 'a_shots500', name: '500 arremessos', desc: 'Registre 500 arremessos', emoji: '🏹', tier: 'prata', coins: 200, test: (s) => s.totals.shotsAtt >= 500 },
  { id: 'a_lap_record', name: 'Quebrou o cronômetro', desc: 'Bata seu recorde de corrida', emoji: '⚡', tier: 'prata', coins: 120, test: (s) => s.totals.runs >= 2 && s.runs.length >= 2 && s.runs[s.runs.length - 1].totalMs <= Math.min(...s.runs.map((r) => r.totalMs)) && s.runs[s.runs.length - 1].totalMs < s.runs[0].totalMs },
  { id: 'a_runs10', name: 'Corredor', desc: '10 corridas completas', emoji: '👟', tier: 'ouro', coins: 400, test: (s) => s.totals.runs >= 10 },
  { id: 'a_work25', name: 'Atleta de casa', desc: '25 treinos em casa', emoji: '🏠', tier: 'ouro', coins: 400, test: (s) => s.totals.workouts >= 25 },
  { id: 'a_basket30', name: 'Rato de ginásio', desc: '30 treinos de basquete', emoji: '🏟️', tier: 'platina', coins: 2000, test: (s) => s.totals.basket >= 30 },
  { id: 'a_lvl10', name: 'Amador', desc: 'Chegue ao nível 10', emoji: '⭐', tier: 'prata', coins: 200, test: (s) => levelFromXp(s.xp).level >= 10 },
  { id: 'a_lvl50', name: 'Estrela', desc: 'Chegue ao nível 50', emoji: '🌟', tier: 'platina', coins: 3000, test: (s) => levelFromXp(s.xp).level >= 50 },
  { id: 'a_water', name: 'Hidratado', desc: 'Bata a meta de água 7 vezes', emoji: '💧', tier: 'bronze', coins: 100, test: (s) => s.totals.water >= 7 },
  { id: 'a_sleep', name: 'Sono de campeão', desc: 'Durma no horário 7 vezes', emoji: '😴', tier: 'prata', coins: 150, test: (s) => s.totals.sleep >= 7 },
  { id: 'a_shop', name: 'Primeira compra', desc: 'Compre um item na loja', emoji: '🛍️', tier: 'bronze', coins: 40, test: (s) => s.inventory.length > 8 },
  { id: 'a_reward', name: 'Valeu a pena', desc: 'Resgate um prêmio da vida real', emoji: '🎁', tier: 'ouro', coins: 100, test: (s) => s.totals.redeemed >= 1 },
  { id: 'a_boss', name: 'Caçador de chefes', desc: 'Derrote a missão-chefe do mês', emoji: '👹', tier: 'platina', coins: 1500, test: (s) => s.totals.bossWins >= 1 },
  { id: 'a_friend', name: 'Time formado', desc: 'Adicione um amigo', emoji: '🤝', tier: 'bronze', coins: 80, test: (s) => s.friends.length >= 1 },
  { id: 'a_owl', name: 'Coruja 🦉', desc: 'Secreta: abra o app às 3h da manhã', emoji: '🦉', tier: 'prata', secret: true, coins: 200, test: (s) => s.openedAt3am },
  { id: 'a_punctual', name: 'Pontual', desc: 'Secreta: inicie o basquete às 13:00 por 7 dias', emoji: '⏱️', tier: 'ouro', secret: true, coins: 500, test: (s) => s.punctualStreak >= 7 },
  { id: 'a_perfect', name: 'Dia perfeito', desc: 'Secreta: complete todas as tarefas de um dia', emoji: '💎', tier: 'ouro', secret: true, coins: 300, test: (s) => Object.keys(s.days).some((k) => dayProgress(s, k).pct >= 1) },
  { id: 'a_hot', name: 'Mão calibrada', desc: 'Secreta: 80%+ em um dia com 30+ arremessos', emoji: '🔥', tier: 'platina', secret: true, coins: 800, test: (s) => Object.values(s.days).some((d) => { const a = d.shots.ft[1] + d.shots.mid[1] + d.shots.three[1], m = d.shots.ft[0] + d.shots.mid[0] + d.shots.three[0]; return a >= 30 && m / a >= 0.8; }) },
];

export { dateKey, addDays, monthKey };
