import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_NOTIFICATION_KEY = 'luckyday.reminderNotificationId.v1';
const STREAK_SAVE_NOTIFICATION_KEY = 'luckyday.streakSaveNotificationId.v1';

export type ReminderSyncResult = 'disabled' | 'scheduled' | 'denied' | 'invalid' | 'unsupported';

export type ReminderReading = {
  luckyColor: string;
  luckyNumber: number;
  score: number;
  mainMessage: string;
  action: string;
  luckyTime: string;
  luckyDirection: string;
  chineseZodiac: string;
  zodiacInsight: string;
};

/**
 * Returns the first sentence (or first ~N chars) of a multi-sentence string,
 * used to fit reading content inside an iOS notification body's single visible
 * line on the lock screen.
 */
function firstLineOf(text: string, maxLen: number): string {
  if (!text) return '';
  const sentenceEnd = text.search(/[.!?](\s|$)/);
  const slice = sentenceEnd > 0 ? text.slice(0, sentenceEnd + 1) : text;
  return slice.length > maxLen ? `${slice.slice(0, maxLen - 1).trimEnd()}…` : slice;
}

export function isValidReminderTime(time?: string) {
  if (!time) {
    return true;
  }

  const [hourValue, minuteValue] = time.split(':').map(Number);
  return (
    /^\d{2}:\d{2}$/.test(time) &&
    Number.isInteger(hourValue) &&
    Number.isInteger(minuteValue) &&
    hourValue >= 0 &&
    hourValue <= 23 &&
    minuteValue >= 0 &&
    minuteValue <= 59
  );
}

export async function syncLocalDailyReminder(time?: string, reading?: ReminderReading): Promise<ReminderSyncResult> {
  const reminderTime = time?.trim();

  if (Platform.OS === 'web') {
    return reminderTime ? 'unsupported' : 'disabled';
  }

  await cancelStoredReminder();

  if (!reminderTime) {
    return 'disabled';
  }

  if (!isValidReminderTime(reminderTime)) {
    return 'invalid';
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return 'unsupported';
  }

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return 'denied';
  }

  const [hour, minute] = reminderTime.split(':').map(Number);

  // Personalized bodies use today's actual reading content so the lock-screen
  // preview gives a real glimpse of the almanac, not a generic teaser. The
  // mainMessage is trimmed to fit a single line of iOS lock-screen text.
  const personalizedBodies: string[] = reading
    ? [
        firstLineOf(reading.mainMessage, 110),
        `${reading.luckyColor} today · best time ${reading.luckyTime}.`,
        `Today's almanac suggests: ${reading.action}`.slice(0, 130),
        `${reading.chineseZodiac} energy today. ${firstLineOf(reading.zodiacInsight, 80)}`,
        `Number ${reading.luckyNumber} · ${reading.luckyColor} · ${reading.luckyDirection}.`,
      ]
    : [];

  const genericBodies = [
    "Your color today is set. One tap to find out which.",
    "Today's score is calculated. Is it higher than yesterday?",
    "The Chinese almanac has something specific for you this morning.",
    "Your number is set. So is your best time to act.",
    "A new direction — literally. Open to see your direction today.",
    "Today's moon phase shifts your energy. See exactly how.",
    "Your zodiac animal has a specific message for today.",
    "The right moment to act is noted. Open before the day slips by.",
    "Good day or careful day? The almanac already knows. Open to see.",
    "One sentence describes your energy right now. Tap to read it.",
    "Your color today can change how the morning feels. Open to find out.",
    "Today has a best-time window. Open to see when it is.",
    "Your morning read is fresh: color, number, and one key action.",
    "Something in today's chart is worth knowing before you start.",
    "Today's energy is different from yesterday. Open today's almanac. ✨",
  ];

  const titles = [
    'What does today hold for you? ✨',
    'Your energy score is in 🌙',
    'The almanac chose a color for you 🎨',
    'Your number is waiting 🔢',
    "Today's almanac is sealed ✦",
    "Open today's almanac 🌅",
    'Today is ready 🍀',
    'Your morning ritual is ready 🌸',
    'The stars aligned something for you ✨',
    'One tap to set your day right 🌸',
  ];

  const pool = personalizedBodies.length > 0 ? personalizedBodies : genericBodies;
  const dayIndex = new Date().getDate();
  const bodyIndex = (hour + minute + dayIndex) % pool.length;
  const titleIndex = (dayIndex + hour) % titles.length;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[titleIndex],
      body: pool[bodyIndex],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(REMINDER_NOTIFICATION_KEY, notificationId);
  return 'scheduled';
}

async function cancelStoredReminder() {
  await cancelStoredNotification(REMINDER_NOTIFICATION_KEY);
}

async function cancelStoredNotification(storageKey: string) {
  const notificationId = await AsyncStorage.getItem(storageKey);
  if (!notificationId) {
    return;
  }

  try {
    const Notifications = await getNotifications();
    if (Notifications) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } finally {
    await AsyncStorage.removeItem(storageKey);
  }
}

/**
 * Late-night streak save reminder. Fires daily at 21:30 local time when the
 * user has an active streak (>= 1) so they can record today's reading
 * before the day rolls over and the streak breaks.
 *
 * Cancels itself when streak drops to 0 — no nag for users between streaks.
 */
export async function syncStreakSaveReminder(streak: number): Promise<ReminderSyncResult> {
  if (Platform.OS === 'web') {
    return streak >= 1 ? 'unsupported' : 'disabled';
  }

  await cancelStoredNotification(STREAK_SAVE_NOTIFICATION_KEY);

  if (streak < 1) {
    return 'disabled';
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return 'unsupported';
  }

  // Reuse whatever permission state was set for the morning reminder; do not
  // re-prompt here. Returns silent 'denied' if user previously declined.
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    return 'denied';
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Tonight\'s almanac is open ✦',
      body: `Your ${streak}-day streak holds until midnight. Take 10 seconds to read today.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 30,
    },
  });

  await AsyncStorage.setItem(STREAK_SAVE_NOTIFICATION_KEY, id);
  return 'scheduled';
}

async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}
