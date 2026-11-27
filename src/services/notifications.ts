import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { State } from '../types';
import { pick } from '../data/messages';
import { dateKey, hhmm, minutesOf, isWeekend, addDays, parseKey } from '../utils/date';

const T = Notifications.SchedulableTriggerInputTypes;
export const CHANNEL = 'rotina-alarmes';

export function setupNotifications() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
  } catch {}
}

export async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Alarmes e lembretes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 800],
      lightColor: '#FF6B1A',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  } catch {}
}

export async function getPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    return cur.granted;
  } catch { return false; }
}
export async function requestPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const res = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return res.granted;
  } catch { return false; }
}

async function daily(weekdays: number[], time: string, title: string, body: string) {
  const { h, m } = hhmm(time);
  const content = { title, body, sound: 'default' as const, priority: Notifications.AndroidNotificationPriority.MAX, interruptionLevel: 'timeSensitive' as const };
  if (weekdays.length === 7) { // 1 só agendamento (iOS limita a 64 notificações pendentes)
    try { await Notifications.scheduleNotificationAsync({ content, trigger: { type: T.DAILY, hour: h, minute: m, channelId: CHANNEL } }); } catch {}
    return;
  }
  for (const weekday of weekdays) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default', priority: Notifications.AndroidNotificationPriority.MAX, interruptionLevel: 'timeSensitive' },
        trigger: { type: T.WEEKLY, weekday, hour: h, minute: m, channelId: CHANNEL },
      });
    } catch {}
  }
}
async function once(date: Date, title: string, body: string) {
  if (date.getTime() <= Date.now() + 5000) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', priority: Notifications.AndroidNotificationPriority.MAX },
      trigger: { type: T.DATE, date, channelId: CHANNEL },
    });
  } catch {}
}

// weekday: 1=domingo ... 7=sábado
const ALL = [1, 2, 3, 4, 5, 6, 7];
const SCHOOL_MORNING = [2, 3, 4, 5, 6];
const SCHOOL_EVE = [1, 2, 3, 4, 5]; // noite antes de aula (dom–qui)

/** Reagenda TODOS os lembretes com base no estado atual. Chame ao abrir o app e ao mudar configurações. */
export async function rescheduleAll(s: State, basketStartedToday: boolean) {
  try {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    const { settings: st, profile } = s;
    if (st.vacation) return; // férias: sem lembretes
    const nome = profile.name || 'Júlio';
    const P = (k: string, v?: Record<string, string | number>) => pick(k, st.personality, st.funny, { nome, ...(v ?? {}) });
    const days = (d: number[]) => (st.muteWeekends ? d.filter((x) => x !== 1 && x !== 7) : d);

    if (st.notifs.basket) {
      await daily(days(ALL), st.times.basketPre, '🏀 Treino já já', P('basketPre'));
      await daily(days(ALL), st.times.basket, '🏀 Hora do basquete!', P('basketNow'));
    }
    if (st.notifs.late) {
      // aviso pontual (15 min após o início) — cancelado quando o treino começa
      const { h, m } = hhmm(st.times.basket);
      for (let i = 0; i < 4; i++) {
        const k = addDays(dateKey(), i);
        const d = parseKey(k);
        if (st.muteWeekends && isWeekend(d)) continue;
        if (i === 0 && basketStartedToday) continue;
        d.setHours(h, m + 15, 0, 0);
        await once(d, '👀 Cadê você?', P('basketLate'));
      }
    }
    if (st.notifs.fone) {
      await daily(days(SCHOOL_EVE), st.times.fone, '🎧 Fone', P('fone'));
      await daily(days(SCHOOL_MORNING), st.times.foneMorning, '🎒 Antes de sair', P('foneManha'));
    }
    if (st.notifs.bed) {
      const bed = minutesOf(profile.bedtime) - st.times.bedPre;
      const t = `${String(Math.floor(((bed + 1440) % 1440) / 60)).padStart(2, '0')}:${String(((bed % 60) + 60) % 60).padStart(2, '0')}`;
      await daily(days(ALL), t, '😴 Hora de dormir', P('bed'));
    }
    if (st.notifs.water) {
      for (let h = st.times.waterStart; h <= st.times.waterEnd; h += Math.max(1, st.times.waterEvery)) {
        await daily(days(ALL), `${String(h).padStart(2, '0')}:00`, '💧 Água', P('water'));
      }
    }
    if (st.notifs.miss) {
      const d = new Date(); d.setDate(d.getDate() + 3); d.setHours(18, 0, 0, 0);
      await once(d, '😢 Saudade!', P('missed'));
    }
    if (profile.birthday) {
      const [dd, mm] = profile.birthday.split('/').map(Number);
      if (dd && mm) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: { title: '🎂 Parabéns!', body: P('birthday'), sound: 'default' },
            trigger: { type: T.YEARLY, month: mm - 1, day: dd, hour: 9, minute: 0, channelId: CHANNEL },
          });
        } catch {}
      }
    }
  } catch {}
}

export async function notifyNow(title: string, body: string) {
  try { await Notifications.scheduleNotificationAsync({ content: { title, body, sound: 'default' }, trigger: null }); } catch {}
}
