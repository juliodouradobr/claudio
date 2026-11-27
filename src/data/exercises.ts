import { Level, Workout } from '../types';

export interface Exercise {
  id: string; name: string; emoji: string; timed?: boolean; desc: string; metric?: 'push' | 'squat' | 'situp';
  levels: Record<Level, { sets: number; reps: number; rest: number }>;
}
export const LEVELS: { id: Level; label: string; color: string }[] = [
  { id: 'iniciante', label: 'Iniciante', color: '#22D3A6' },
  { id: 'intermediario', label: 'Intermediário', color: '#FFB020' },
  { id: 'avancado', label: 'Avançado', color: '#FF4D4D' },
];

export const EXERCISES: Exercise[] = [
  { id: 'flexao', name: 'Flexão', emoji: '💪', metric: 'push', desc: 'Mãos na largura dos ombros, corpo reto como uma tábua. Desça até o peito quase tocar o chão e empurre de volta. Dica: joelhos no chão se estiver difícil.', levels: { iniciante: { sets: 3, reps: 8, rest: 45 }, intermediario: { sets: 3, reps: 15, rest: 40 }, avancado: { sets: 4, reps: 25, rest: 30 } } },
  { id: 'agachamento', name: 'Agachamento', emoji: '🦵', metric: 'squat', desc: 'Pés na largura dos ombros. Sente para trás como se fosse numa cadeira, joelhos alinhados com os pés, costas retas. Suba empurrando o chão.', levels: { iniciante: { sets: 3, reps: 12, rest: 40 }, intermediario: { sets: 4, reps: 20, rest: 35 }, avancado: { sets: 5, reps: 30, rest: 30 } } },
  { id: 'abdominal', name: 'Abdominal', emoji: '🔥', metric: 'situp', desc: 'Deitado, joelhos dobrados, mãos atrás da cabeça sem puxar o pescoço. Suba o tronco contraindo a barriga e desça devagar.', levels: { iniciante: { sets: 3, reps: 12, rest: 40 }, intermediario: { sets: 3, reps: 20, rest: 35 }, avancado: { sets: 4, reps: 30, rest: 30 } } },
  { id: 'prancha', name: 'Prancha', emoji: '🧱', timed: true, desc: 'Apoie antebraços e pontas dos pés. Corpo em linha reta, barriga firme, sem deixar o quadril cair. Respire normal. (Repetições = segundos)', levels: { iniciante: { sets: 3, reps: 20, rest: 30 }, intermediario: { sets: 3, reps: 40, rest: 30 }, avancado: { sets: 4, reps: 60, rest: 30 } } },
  { id: 'polichinelo', name: 'Polichinelo', emoji: '⭐', desc: 'Salte abrindo pernas e braços acima da cabeça, depois volte juntando tudo. Ritmo constante, aterrissando leve.', levels: { iniciante: { sets: 3, reps: 20, rest: 30 }, intermediario: { sets: 3, reps: 35, rest: 30 }, avancado: { sets: 4, reps: 50, rest: 25 } } },
  { id: 'burpee', name: 'Burpee', emoji: '🚀', desc: 'Agache, apoie as mãos, jogue os pés para trás (posição de prancha), volte os pés e salte com os braços para cima. O mais difícil — vai no seu ritmo!', levels: { iniciante: { sets: 3, reps: 5, rest: 50 }, intermediario: { sets: 3, reps: 10, rest: 45 }, avancado: { sets: 4, reps: 15, rest: 40 } } },
  { id: 'afundo', name: 'Afundo', emoji: '🏃', desc: 'Dê um passo grande à frente e desça até os dois joelhos formarem ~90°. O joelho de trás quase toca o chão. Alterne as pernas.', levels: { iniciante: { sets: 3, reps: 8, rest: 40 }, intermediario: { sets: 3, reps: 14, rest: 35 }, avancado: { sets: 4, reps: 20, rest: 30 } } },
];
export const exById = (id: string) => EXERCISES.find((e) => e.id === id)!;

export const presetWorkouts = (level: Level): Workout[] => {
  const mk = (id: string, name: string, ids: string[]): Workout => ({
    id: `${id}-${level}`, name, level,
    items: ids.map((exerciseId) => ({ exerciseId, ...exById(exerciseId).levels[level] })),
  });
  return [
    mk('full', 'Corpo todo', EXERCISES.map((e) => e.id)),
    mk('express', 'Express', ['polichinelo', 'flexao', 'agachamento', 'prancha']),
    mk('core', 'Barriga & pernas', ['abdominal', 'prancha', 'agachamento', 'afundo']),
  ];
};
export const workoutMinutes = (w: Workout) =>
  Math.round(w.items.reduce((a, i) => a + i.sets * ((exById(i.exerciseId).timed ? i.reps : i.reps * 2.5 + 10) + i.rest), 0) / 60);
