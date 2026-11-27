import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../store';
import { Btn, Card, Chip, H1, H2, Input, Ionicons, Row, Screen, T } from '../components/ui';
import { EXERCISES, LEVELS, exById, presetWorkouts, workoutMinutes } from '../data/exercises';
import { Workout, WorkoutItem } from '../types';
import { useTheme } from '../theme';
import WorkoutRunner from '../components/WorkoutRunner';
import { uid } from '../utils/date';

const Stepper = ({ label, value, onChange, min = 1, max = 99, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) => {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T size={11} color={t.sub} weight="bold">{label}</T>
      <Row style={{ gap: 6 }}>
        <Pressable onPress={() => onChange(Math.max(min, value - step))}><Ionicons name="remove-circle" size={26} color={t.accent} /></Pressable>
        <T weight="black" size={16} style={{ minWidth: 28, textAlign: 'center' }}>{value}</T>
        <Pressable onPress={() => onChange(Math.min(max, value + step))}><Ionicons name="add-circle" size={26} color={t.accent} /></Pressable>
      </Row>
    </View>
  );
};

export default function Workouts() {
  const { s, A } = useStore();
  const t = useTheme();
  const [running, setRunning] = useState<Workout | null>(null);
  const [building, setBuilding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [items, setItems] = useState<WorkoutItem[]>([]);
  const level = s.workoutLevel;
  const lv = LEVELS.find((l) => l.id === level)!;
  const toggleEx = (id: string) => {
    setItems((cur) => (cur.find((i) => i.exerciseId === id) ? cur.filter((i) => i.exerciseId !== id) : [...cur, { exerciseId: id, ...exById(id).levels[level] }]));
  };
  const upd = (id: string, p: Partial<WorkoutItem>) => setItems((cur) => cur.map((i) => (i.exerciseId === id ? { ...i, ...p } : i)));
  const save = () => {
    if (!items.length) return;
    A.addWorkout({ id: uid(), name: name.trim() || 'Meu treino', level: 'custom', items });
    setBuilding(false); setItems([]); setName('');
  };
  const card = (w: Workout, custom?: boolean) => (
    <Card key={w.id}>
      <Row>
        <View style={{ flex: 1 }}>
          <H2>{w.name}</H2>
          <T size={12} color={t.sub} weight="semi">{w.items.length} exercícios · ~{workoutMinutes(w)} min</T>
        </View>
        {custom && <Pressable onPress={() => A.removeWorkout(w.id)}><Ionicons name="trash-outline" size={22} color={t.danger} /></Pressable>}
      </Row>
      <T size={20} style={{ marginVertical: 8 }}>{w.items.map((i) => exById(i.exerciseId).emoji).join('  ')}</T>
      <Btn label="Iniciar treino (+50 XP)" icon="play" onPress={() => setRunning(w)} />
    </Card>
  );

  return (
    <Screen>
      <H1>Treinos em casa 💪</H1>
      <T color={t.sub}>Sem equipamento. Escolha o nível e bora suar!</T>
      <Row>{LEVELS.map((l) => <Chip key={l.id} label={l.label} color={l.color} active={level === l.id} onPress={() => A.setWorkoutLevel(l.id)} />)}</Row>

      {presetWorkouts(level).map((w) => card(w))}
      {s.customWorkouts.length > 0 && <H2>Meus treinos</H2>}
      {s.customWorkouts.map((w) => card(w, true))}

      {!building ? (
        <Btn outline label="Montar meu próprio treino" icon="construct" onPress={() => { setBuilding(true); setItems([]); }} />
      ) : (
        <Card>
          <H2>Montar treino</H2>
          <Input value={name} onChangeText={setName} placeholder="Nome do treino" maxLength={30} style={{ marginVertical: 10 }} />
          {EXERCISES.map((e) => {
            const it = items.find((i) => i.exerciseId === e.id);
            return (
              <View key={e.id} style={{ borderTopWidth: 1, borderTopColor: t.border, paddingVertical: 8 }}>
                <Pressable onPress={() => toggleEx(e.id)}><Row><Ionicons name={it ? 'checkbox' : 'square-outline'} size={24} color={it ? t.green : t.sub} /><T size={20}>{e.emoji}</T><T weight="bold">{e.name}</T></Row></Pressable>
                {it && (
                  <Row style={{ marginTop: 6 }}>
                    <Stepper label="Séries" value={it.sets} onChange={(n) => upd(e.id, { sets: n })} max={8} />
                    <Stepper label={e.timed ? 'Segundos' : 'Reps'} value={it.reps} onChange={(n) => upd(e.id, { reps: n })} max={120} step={e.timed ? 5 : 1} />
                    <Stepper label="Descanso(s)" value={it.rest} onChange={(n) => upd(e.id, { rest: n })} min={10} max={120} step={5} />
                  </Row>
                )}
              </View>
            );
          })}
          <Row style={{ marginTop: 12 }}><Btn outline label="Cancelar" onPress={() => setBuilding(false)} style={{ flex: 1 }} /><Btn label="Salvar" icon="save" onPress={save} disabled={!items.length} style={{ flex: 1 }} /></Row>
        </Card>
      )}

      <H2 style={{ marginTop: 8 }}>Biblioteca de exercícios</H2>
      {EXERCISES.map((e) => {
        const l = e.levels[level];
        return (
          <Pressable key={e.id} onPress={() => setOpen(open === e.id ? null : e.id)}>
            <Card pad={14}>
              <Row><T size={28}>{e.emoji}</T><View style={{ flex: 1 }}><T weight="black" size={17}>{e.name}</T><T size={12} color={lv.color} weight="bold">{l.sets} séries × {l.reps}{e.timed ? 's' : ' reps'} · descanso {l.rest}s</T></View><Ionicons name={open === e.id ? 'chevron-up' : 'chevron-down'} size={20} color={t.sub} /></Row>
              {open === e.id && <T size={13} color={t.sub} style={{ marginTop: 10, lineHeight: 20 }}>{e.desc}</T>}
            </Card>
          </Pressable>
        );
      })}
      <WorkoutRunner workout={running} onClose={() => setRunning(null)} />
    </Screen>
  );
}
