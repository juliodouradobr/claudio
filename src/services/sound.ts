import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const SOURCES = {
  coin: require('../../assets/sounds/coin.wav'),
  xp: require('../../assets/sounds/xp.wav'),
  levelup: require('../../assets/sounds/levelup.wav'),
  chest: require('../../assets/sounds/chest.wav'),
  beep: require('../../assets/sounds/beep.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  block: require('../../assets/sounds/block.wav'),
  success: require('../../assets/sounds/success.wav'),
  alarm_classic: require('../../assets/sounds/alarm_classic.wav'),
  alarm_arcade: require('../../assets/sounds/alarm_arcade.wav'),
  alarm_horn: require('../../assets/sounds/alarm_horn.wav'),
  alarm_zen: require('../../assets/sounds/alarm_zen.wav'),
  music: require('../../assets/sounds/music.wav'),
} as const;
export type SoundName = keyof typeof SOURCES;

export const config = { sound: true, haptics: true, music: true, alarm: 'alarm_classic' as SoundName };
const players: Partial<Record<SoundName, AudioPlayer>> = {};
let inited = false;

export async function initAudio() {
  if (inited) return;
  inited = true;
  try { await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }); } catch {}
}
function getPlayer(n: SoundName) {
  if (!players[n]) {
    try { players[n] = createAudioPlayer(SOURCES[n]); } catch { return undefined; }
  }
  return players[n];
}
export function play(n: SoundName) {
  if (!config.sound) return;
  try {
    const p = getPlayer(n);
    if (!p) return;
    p.seekTo(0);
    p.play();
  } catch {}
}
export const playAlarm = () => play(config.alarm);

let musicPlayer: AudioPlayer | undefined;
export function startMusic() {
  if (!config.music || !config.sound) return;
  try {
    musicPlayer = musicPlayer ?? createAudioPlayer(SOURCES.music);
    musicPlayer.loop = true;
    musicPlayer.volume = 0.35;
    musicPlayer.play();
  } catch {}
}
export function stopMusic() { try { musicPlayer?.pause(); } catch {} }

export const haptic = {
  light: () => config.haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => config.haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () => config.haptics && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => config.haptics && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  /** vibração longa (troca de bloco / fim de descanso) */
  burst: () => {
    if (!config.haptics) return;
    [0, 150, 300].forEach((t) => setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), t));
  },
};
