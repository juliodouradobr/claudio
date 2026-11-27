import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), ms); return () => clearInterval(i); }, [ms]);
  return now;
};

/** Cronômetro/Contador baseado em relógio real (não "desvia" se o app for pro segundo plano). */
export function useClock(speed = 1) {
  const [, force] = useState(0);
  const st = useRef({ running: false, base: 0, startedAt: 0 });
  useEffect(() => {
    const i = setInterval(() => { if (st.current.running) force((x) => x + 1); }, 100);
    const sub = AppState.addEventListener('change', (a) => a === 'active' && force((x) => x + 1));
    return () => { clearInterval(i); sub.remove(); };
  }, []);
  const read = () => st.current.base + (st.current.running ? (Date.now() - st.current.startedAt) * speed : 0);
  return {
    ms: read(),
    running: st.current.running,
    start() { if (!st.current.running) { st.current.running = true; st.current.startedAt = Date.now(); force((x) => x + 1); } },
    pause() { if (st.current.running) { st.current.base = read(); st.current.running = false; force((x) => x + 1); } },
    reset() { st.current = { running: false, base: 0, startedAt: 0 }; force((x) => x + 1); },
    read,
  };
}
