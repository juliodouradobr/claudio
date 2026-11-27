import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { Workout } from '../types';
import { exById } from '../data/exercises';
import { useStore } from '../store';
import { useTheme } from '../theme';
import { Bar, Btn, Card, H1, Row, T } from './ui';
import { Ring } from './graphics';
import { fmtClock } from '../utils/date';
import { haptic, play, playAlarm, startMusic, stopMusic } from '../services/sound';

type Phase = 'ready' | 'work' | 'rest' | 'done';
function Awake() { useKeepAwake(); return null; }

export default function WorkoutRunner({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  const { s, A } = useStore();
  const t = useTheme();
  const ins = useSafeAreaInsets();
  const speed = s.settings.testMode ? 30 : 1;
  const steps = useMemo(() => (workout ? workout.items.flatMap((it, ei) => Array.from({ length: it.sets }, (_, si) => ({ ...it, ei, si }))) : []), [workout]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [, tick] = useState(0);
  const phaseStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());
  const reps = useRef({ push: 0, squat: 0, situp: 0, other: 0 });
  const finished = useRef(false);

  useEffect(() => {
    if (!workout) return;
    setIdx(0); setPhase('ready'); reps.current = { push: 0, squat: 0, situp: 0, other: 0 }; finished.current = false; sessionStart.current = Date.now();
    A.say('startWorkout'); startMusic();
    return () => stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout]);
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 200); return () => clearInterval(i); }, []);

  const step = steps[idx];
  const ex = step ? exById(step.exerciseId) : null;
  const elapsed = ((Date.now() - phaseStart.current) / 1000) * speed;
  const go = (p: Phase) => { phaseStart.current = Date.now(); setPhase(p); };

  const completeSet = () => {
    if (!step || !ex) return;
    const key = ex.metric ?? 'other';
    reps.current[key] += ex.timed ? 0 : step.reps;
    if (ex.timed) reps.current.other += Math.round(step.reps / 3);
    play('success'); haptic.success();
    if (idx + 1 >= steps.length) { setPhase('done'); stopMusic(); return; }
    go('rest');
  };

  // fim automático: prancha (contagem regressiva) e descanso
  useEffect(() => {
    if (!step || !ex) return;
    if (phase === 'work' && ex.timed && elapsed >= step.reps) completeSet();
    if (phase === 'rest' && elapsed >= step.rest) { playAlarm(); haptic.burst(); setIdx((i) => i + 1); go('ready'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });
  const lastTick = useRef(-1);
  useEffect(() => {
    if (phase !== 'rest' || !step) return;
    const left = Math.ceil(step.rest - elapsed);
    if (left <= 3 && left > 0 && lastTick.current !== left) { lastTick.current = left; play('tick'); haptic.light(); }
    if (left > 3) lastTick.current = -1;
  });

  useEffect(() => {
    if (phase === 'done' && !finished.current) {
      finished.current = true;
      const minutes = Math.max(1, Math.round(((Date.now() - sessionStart.current) / 60000) * speed));
      A.finishWorkout({ minutes, reps: reps.current, counts: !s.settings.testMode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!workout) return null;
  const total = steps.length;
  const minWork = ex && step ? (ex.timed ? step.reps : Math.max(8, step.reps * 1.5)) : 0;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Awake />
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: ins.top + 10 }}>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: ins.bottom + 30 }}>
          <Row><T weight="black" size={16} style={{ flex: 1 }}>{workout.name}</T><Btn small outline label="Sair" onPress={onClose} color={t.danger} /></Row>
          <Bar pct={phase === 'done' ? 1 : idx / total} color={t.green} height={10} />
          <T size={12} color={t.sub} weight="bold">Série {Math.min(idx + 1, total)} de {total}</T>

          {phase === 'done' ? (
            <Card glow={t.green}>
              <T size={60} center>🏆</T>
              <H1 style={{ textAlign: 'center' }}>Treino concluído!</H1>
              <T center color={t.sub}>{s.settings.testMode ? 'Modo teste: nenhum XP foi dado.' : 'XP e moedas já estão na sua conta 💪'}</T>
              <Btn label="Fechar" onPress={onClose} style={{ marginTop: 16 }} />
            </Card>
          ) : ex && step ? (
            <>
              <Card>
                <T size={56} center>{ex.emoji}</T>
                <H1 style={{ textAlign: 'center', fontSize: 30 }}>{ex.name}</H1>
                <T center color={t.accent} weight="black" size={20}>{step.reps} {ex.timed ? 'segundos' : 'repetições'} · série {step.si + 1}/{step.sets}</T>
                <T color={t.sub} size={13} style={{ marginTop: 10, lineHeight: 19 }}>{ex.desc}</T>
              </Card>

              <View style={{ alignItems: 'center' }}>
                {phase === 'ready' && <Btn big label="COMEÇAR SÉRIE" icon="play" onPress={() => go('work')} style={{ alignSelf: 'stretch' }} />}
                {phase === 'work' && (
                  <>
                    <Ring size={200} stroke={16} pct={ex.timed ? elapsed / step.reps : Math.min(1, elapsed / minWork)} color={t.accent}>
                      <T size={42} weight="black">{fmtClock(ex.timed ? Math.max(0, step.reps - elapsed) : elapsed)}</T>
                      <T size={12} color={t.sub} weight="bold">{ex.timed ? 'segure firme!' : 'tempo de execução'}</T>
                    </Ring>
                    {!ex.timed && <Btn big label={elapsed >= minWork ? 'CONCLUÍ A SÉRIE ✓' : `Faça com calma… (${Math.ceil(minWork - elapsed)}s)`} disabled={elapsed < minWork} onPress={completeSet} color={t.green} style={{ alignSelf: 'stretch', marginTop: 18 }} />}
                  </>
                )}
                {phase === 'rest' && (
                  <>
                    <Ring size={200} stroke={16} pct={1 - elapsed / step.rest} color={t.green}>
                      <T size={13} weight="black" color={t.green}>DESCANSO</T>
                      <T size={46} weight="black">{Math.ceil(Math.max(0, step.rest - elapsed))}</T>
                      <T size={12} color={t.sub} weight="bold">respire e beba água</T>
                    </Ring>
                    <T color={t.sub} size={13} center style={{ marginTop: 12 }}>Próximo: {exById(steps[idx + 1].exerciseId).emoji} {exById(steps[idx + 1].exerciseId).name}</T>
                    <Btn outline small label="Pular descanso" onPress={() => { setIdx((i) => i + 1); go('ready'); }} style={{ marginTop: 10 }} />
                  </>
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
