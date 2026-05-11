import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_NOTIFICATION_KEY = 'luckyday.reminderNotificationId.v1';

export type ReminderSyncResult = 'disabled' | 'scheduled' | 'denied' | 'invalid' | 'unsupported';

export type ReminderReading = {
  luckyColor: string;
  luckyNumber: number;
  score: number;
};

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

  // If we have today's reading, use personalized bodies; otherwise use generic ones
  const personalizedBodies: string[] = reading
    ? [
        `Your lucky color today is ${reading.luckyColor}. Open to see what it means for you.`,
        `Number ${reading.luckyNumber} is yours today. Open LuckyDay to see the full picture.`,
        `Today's energy score is ${reading.score}. Open to see your ${reading.luckyColor.toLowerCase()} luck.`,
        `${reading.luckyColor} is your color today, and ${reading.luckyNumber} is your number. Your reading is ready.`,
        `Daily energy: ${reading.score} ✨ Color: ${reading.luckyColor}. See what the almanac says today.`,
      ]
    : [];

  const genericBodies = [
    "What.s your color today? One tap to find out.",
    "Today's score is calculated. Is it higher than yesterday?",
    "The Chinese almanac has something specific for you this morning.",
    "Your lucky number is set. So is your best time to act.",
    "A new direction — literally. Open to see your direction today.",
    "Today's moon phase shifts your energy. See exactly how.",
    "Your zodiac animal has a specific message for today.",
    "The right moment to act is noted. Open before the day slips by.",
    "Good day or careful day? The almanac already knows. Open to see.",
    "One sentence describes your energy right now. Tap to read it.",
    "Your lucky color can change how today feels. Open to find out.",
    "Today has a lucky window. Open to see when it is.",
    "Your morning read is fresh: lucky color, number, and one key action.",
    "Something in today's chart is worth knowing before you start.",
    "Today's luck energy is different from yesterday. Rise and reveal. ✨",
  ];

  const titles = [
    'What does today hold for you? ✨',
    'Your energy score is in 🌙',
    'The almanac chose a color for you 🎨',
    'Your lucky number is waiting 🔢',
    "Today's fortune is sealed ✦",
    'Open today.s almanac 🌅',
    'Something lucky is ready 🍀',
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
  const notificationId = await AsyncStorage.getItem(REMINDER_NOTIFICATION_KEY);
  if (!notificationId) {
    return;
  }

  try {
    const Notifications = await getNotifications();
    if (Notifications) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } finally {
    await AsyncStorage.removeItem(REMINDER_NOTIFICATION_KEY);
  }
}

async function getNotifications(): Promise<typeof import('expo-notifications') | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}
