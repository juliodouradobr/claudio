import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useStore } from '../store';
import { Bar, Btn, Card, H1, H2, Row, Screen, T } from '../components/ui';
import { LineChart } from '../components/graphics';
import { useTheme } from '../theme';
import { useClock } from '../utils/hooks';
import { fmtMs, parseKey } from '../utils/date';
import { haptic, play } from '../services/sound';
import { ui } from '../store/ui';

const GOAL = 5;
const MIN_LAP_MS = 15000; // anti-trapaça: volta de menos de 15s não conta (o modo teste ignora)

function Awake() { useKeepAwake(); return null; }

export default function Run() {
  const { s, A } = useStore();
  const t = useTheme();
  const speed = s.settings.testMode ? 30 : 1;
  const clock = useClock(speed);
  const [laps, setLaps] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const mark = useRef(0);
  const started = clock.running || clock.ms > 0;

  const total = clock.ms, cur = total - mark.current;
  const fastest = laps.length ? Math.min(...laps) : 0;
  const avg = laps.length ? laps.reduce((a, b) => a + b, 0) / laps.length : 0;

  const start = () => { clock.start(); A.say('startWorkout'); haptic.medium(); };
  const lap = () => {
    if (!clock.running || finished) return;
    const t0 = clock.read(), lapMs = t0 - mark.current;
    if (lapMs < MIN_LAP_MS && !s.settings.testMode) { ui.bubble('Calma! Volta rápida demais 😅 Corra a volta inteira antes de apertar.'); haptic.warn(); return; }
    const next = [...laps, lapMs];
    mark.current = t0;
    setLaps(next);
    play('beep'); haptic.medium();
    const n = next.length;
    if (n >= GOAL) {
      clock.pause(); setFinished(true);
      A.finishRun(next, t0, !s.settings.testMode);
      return;
    }
    if (n === GOAL - 1) A.say('runLast');
    else if (n > 1 && lapMs < next[n - 2]) A.say('runFaster');
    else if (n === 1) A.say('runFirst');
    else A.say('runLap', { n, t: GOAL });
  };
  const reset = () => { clock.reset(); mark.current = 0; setLaps([]); setFinished(false); };

  const hist = s.runs.slice(-10);
  const best = s.runs.length ? Math.min(...s.runs.map((r) => r.totalMs)) : 0;

  return (
    <Screen>
      {clock.running && <Awake />}
      <H1>Corrida no parque 🏃</H1>
      <T color={t.sub}>Meta: {GOAL} voltas · +80 XP quando o cronômetro terminar.</T>

      <Card glow={finished ? t.green : undefined}>
        <T size={13} weight="black" color={t.sub} center style={{ letterSpacing: 2 }}>TEMPO TOTAL</T>
        <T size={56} weight="black" center style={{ fontVariant: ['tabular-nums'] }}>{fmtMs(total)}</T>
        <Row style={{ justifyContent: 'center', gap: 20, marginVertical: 6 }}>
          <View style={{ alignItems: 'center' }}><T size={11} color={t.sub} weight="bold">VOLTA ATUAL</T><T size={22} weight="black" color={t.accent}>{fmtMs(finished ? 0 : cur)}</T></View>
          <View style={{ alignItems: 'center' }}><T size={11} color={t.sub} weight="bold">VOLTAS</T><T size={22} weight="black" color={t.green}>{laps.length}/{GOAL}</T></View>
        </Row>
        <Bar pct={laps.length / GOAL} color={t.green} height={12} />
        {finished && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <T size={40}>🎉🏆🎉</T>
            <T weight="black" size={20} center>5 voltas completas!</T>
            <T color={t.sub} center>{s.settings.testMode ? 'Modo teste: sem XP' : '+80 XP e moedas na conta'}</T>
          </View>
        )}
      </Card>

      {!started && <Btn big label="INICIAR CORRIDA" icon="play" onPress={start} />}
      {started && !finished && (
        <>
          <Btn big label="+1 VOLTA" icon="add-circle" onPress={lap} disabled={!clock.running} color={t.accent} style={{ transform: [{ scale: 1 }] }} />
          <Row>
            <Btn outline label={clock.running ? 'Pausar' : 'Retomar'} icon={clock.running ? 'pause' : 'play'} onPress={() => (clock.running ? clock.pause() : clock.start())} style={{ flex: 1 }} />
            <Btn outline label="Cancelar" icon="close" color={t.danger} onPress={reset} style={{ flex: 1 }} />
          </Row>
        </>
      )}
      {finished && <Btn label="Nova corrida" icon="refresh" onPress={reset} />}

      {laps.length > 0 && (
        <Card>
          <Row style={{ marginBottom: 8 }}>
            <View style={{ flex: 1 }}><T size={11} color={t.sub} weight="bold">⚡ MAIS RÁPIDA</T><T size={20} weight="black" color={t.green}>{fmtMs(fastest)}</T></View>
            <View style={{ flex: 1 }}><T size={11} color={t.sub} weight="bold">⏱️ MÉDIA</T><T size={20} weight="black">{fmtMs(avg)}</T></View>
          </Row>
          {laps.map((l, i) => (
            <Row key={i} style={{ paddingVertical: 6, borderTopWidth: 1, borderTopColor: t.border }}>
              <T weight="bold" style={{ flex: 1 }}>Volta {i + 1} {l === fastest && laps.length > 1 ? '⚡' : ''}</T>
              <T weight="black" color={l === fastest ? t.green : t.text}>{fmtMs(l)}</T>
              {i > 0 && <T size={12} weight="bold" color={l < laps[i - 1] ? t.green : t.danger}>{l < laps[i - 1] ? '▼' : '▲'} {Math.abs((l - laps[i - 1]) / 1000).toFixed(1)}s</T>}
            </Row>
          ))}
        </Card>
      )}

      <Card>
        <H2>Evolução 📈</H2>
        <T size={12} color={t.sub} style={{ marginBottom: 6 }}>Tempo total das últimas corridas (minutos) — quanto mais baixo, melhor</T>
        <LineChart data={hist.map((r) => r.totalMs / 60000)} labels={hist.map((r) => `${parseKey(r.date).getDate()}/${parseKey(r.date).getMonth() + 1}`)} color={t.green} suffix="m" invert />
        {best > 0 && <T size={13} weight="black" color={t.accent} style={{ marginTop: 6 }}>🏅 Recorde: {fmtMs(best)}</T>}
      </Card>

      {s.runs.length > 0 && (
        <Card>
          <H2 style={{ marginBottom: 6 }}>Histórico</H2>
          {[...s.runs].reverse().slice(0, 12).map((r) => (
            <Row key={r.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.border }}>
              <T weight="semi" style={{ flex: 1 }}>{parseKey(r.date).toLocaleDateString('pt-BR')}</T>
              <T size={12} color={t.sub}>melhor volta {fmtMs(r.fastest)}</T>
              <T weight="black" color={r.totalMs === best ? t.accent : t.text}>{fmtMs(r.totalMs)}{r.totalMs === best ? ' 🏅' : ''}</T>
            </Row>
          ))}
        </Card>
      )}
    </Screen>
  );
}
