export type Level = 'iniciante' | 'intermediario' | 'avancado';
export type Personality = 'durao' | 'zoeiro' | 'calmo';
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario';
export type Slot = 'jersey' | 'shoes' | 'ball' | 'accessory' | 'theme' | 'alarm' | 'court' | 'effect';

export interface WorkoutItem { exerciseId: string; sets: number; reps: number; rest: number }
export interface Workout { id: string; name: string; level: Level | 'custom'; items: WorkoutItem[] }

export interface AvatarCfg { skin: string; hair: number; hairColor: string }

export interface DayLog {
  tasks: { workout?: boolean; run?: boolean; basket?: boolean; checklist?: boolean; water?: boolean; sleep?: boolean };
  water: number;
  checks: string[];
  shots: { ft: [number, number]; mid: [number, number]; three: [number, number] };
  reps: { push: number; squat: number; situp: number; other: number };
  laps: number;
  lap3?: number; // melhor 3ª volta (s)
  minutes: number;
  workouts: number;
  xp: number;
  done: boolean;
  basketStarted?: boolean;
}

export interface RunRecord { id: string; date: string; totalMs: number; laps: number[]; fastest: number; avg: number }
export interface Friend { code: string; name: string; level: number; overall: number; weekXp: number; weekFt: number; avatar: AvatarCfg; equipped: Record<string, string>; updated: string }
export interface Challenge { id: string; friendCode: string; metric: 'ft' | 'xp'; week: string; myBase: number }
export interface RealReward { id: string; name: string; cost: number }
export interface Redeemed { id: string; name: string; cost: number; at: string }

export interface Settings {
  theme: 'dark' | 'light';
  personality: Personality;
  funny: boolean;
  sound: boolean;
  music: boolean;
  haptics: boolean;
  muteWeekends: boolean;
  vacation: boolean;
  testMode: boolean;
  waterGoal: number;
  times: { basket: string; basketPre: string; fone: string; foneMorning: string; bedPre: number; waterEvery: number; waterStart: number; waterEnd: number };
  notifs: { basket: boolean; fone: boolean; water: boolean; bed: boolean; late: boolean; miss: boolean };
}

export interface State {
  loaded: boolean;
  onboarded: boolean;
  profile: { name: string; schoolTime: string; bedtime: string; birthday: string; avatar: AvatarCfg };
  settings: Settings;
  xp: number;
  coins: number;
  streak: { current: number; best: number; last: string };
  shields: number;
  days: Record<string, DayLog>;
  checklist: { id: string; label: string }[];
  customWorkouts: Workout[];
  workoutLevel: Level;
  runs: RunRecord[];
  totals: { workouts: number; reps: number; runs: number; laps: number; bestRunMs: number; bestLapMs: number; basket: number; basketMin: number; shotsMade: number; shotsAtt: number; ft: number; sleep: number; checklist: number; water: number; chests: number; redeemed: number; spins: number; bossWins: number; missions: number };
  inventory: string[];
  equipped: Record<string, string>;
  rewards: RealReward[];
  redeemed: Redeemed[];
  claimed: Record<string, boolean>;
  achievements: Record<string, string>;
  chestFlags: { daily: string; special: string; wheel: string };
  friends: Friend[];
  challenges: Challenge[];
  lastOpen: string;
  prevOpen: string;
  basketStartTimes: string[]; // HH:MM:SS de início por dia pontual
  punctualStreak: number;
  speedCaps: number;
  openedAt3am: boolean;
}
