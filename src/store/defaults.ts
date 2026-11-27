import { State } from '../types';
import { DEFAULT_EQUIPPED, ITEMS } from '../data/game';

export const DEFAULT_CHECKLIST = [
  { id: 'fone', label: 'Fone de ouvido 🎧' }, { id: 'carregador', label: 'Carregador 🔌' }, { id: 'garrafa', label: 'Garrafa de água 💧' },
  { id: 'material', label: 'Material escolar 📚' }, { id: 'lanche', label: 'Lanche 🥪' },
];
export const initialState = (): State => ({
  loaded: false,
  onboarded: false,
  profile: { name: 'Júlio', schoolTime: '07:00', bedtime: '22:00', birthday: '', avatar: { skin: '#C68642', hair: 0, hairColor: '#1B1B1F' } },
  settings: {
    theme: 'dark', personality: 'zoeiro', funny: true, sound: true, music: true, haptics: true, muteWeekends: false, vacation: false, testMode: false, waterGoal: 8,
    times: { basket: '13:00', basketPre: '12:45', fone: '21:30', foneMorning: '06:30', bedPre: 30, waterEvery: 2, waterStart: 9, waterEnd: 19 },
    notifs: { basket: true, fone: true, water: true, bed: true, late: true, miss: true },
  },
  xp: 0, coins: 50,
  streak: { current: 0, best: 0, last: '' },
  shields: 0,
  days: {},
  checklist: DEFAULT_CHECKLIST,
  customWorkouts: [],
  workoutLevel: 'iniciante',
  runs: [],
  totals: { workouts: 0, reps: 0, runs: 0, laps: 0, bestRunMs: 0, bestLapMs: 0, basket: 0, basketMin: 0, shotsMade: 0, shotsAtt: 0, ft: 0, sleep: 0, checklist: 0, water: 0, chests: 0, redeemed: 0, spins: 0, bossWins: 0, missions: 0 },
  inventory: ITEMS.filter((i) => i.free).map((i) => i.id),
  equipped: { ...DEFAULT_EQUIPPED },
  rewards: [
    { id: 'r1', name: '1 hora de videogame 🎮', cost: 300 },
    { id: 'r2', name: 'Pedir lanche no fim de semana 🍔', cost: 1000 },
    { id: 'r3', name: 'Comprar um tênis novo 👟', cost: 10000 },
  ],
  redeemed: [],
  claimed: {},
  achievements: {},
  chestFlags: { daily: '', special: '', wheel: '' },
  friends: [],
  challenges: [],
  lastOpen: '',
  prevOpen: '',
  basketStartTimes: [],
  punctualStreak: 0,
  speedCaps: 0,
  openedAt3am: false,
});
