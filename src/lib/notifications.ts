import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
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

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return 'denied';
  }

  const [hour, minute] = reminderTime.split(':').map(Number);

  // If we have today's reading, use personalized bodies; otherwise use generic ones
  const personalizedBodies: string[] = reading
    ? [
        `Your lucky color today is ${reading.luckyColor}. Open to see what it means for you.`,
        `Lucky number ${reading.luckyNumber} is yours today. Open LuckyDay to see the full picture.`,
        `Today's energy score is ${reading.score}. Open to see your ${reading.luckyColor.toLowerCase()} luck.`,
        `${reading.luckyColor} is your color today, and ${reading.luckyNumber} is your number. Your reading is ready.`,
        `Luck energy: ${reading.score} ✨ Lucky color: ${reading.luckyColor}. See what the almanac says today.`,
      ]
    : [];

  const genericBodies = [
    "Your lucky color and number are waiting. Open to reveal.",
    "Today's luck energy is ready for you. ✨",
    "A new reading is ready. Start your morning ritual.",
    "Your Chinese zodiac energy is in. Open LuckyDay.",
    "Today's lucky moment is here. Don't miss it.",
    "Your Chinese almanac guidance is ready. Open to find out.",
    "Your daily luck ritual is ready. One tap to reveal.",
    "Something good is lined up for you today. Open to see.",
    "Your lucky color is chosen. Your number is set. Go.",
    "A quiet moment of luck is waiting for you this morning.",
    "Today's energy reading is fresh. Rise and reveal. ✨",
    "Your ritual is ready. Lucky color, number, and more.",
    "The day's fortune is ready. A few seconds to start it right.",
    "Open LuckyDay to see what today's energy holds.",
    "Your morning luck reading is waiting. ✨",
  ];

  const titles = [
    'Your LuckyDay is ready ✨',
    'A new reading awaits 🌸',
    'Your luck ritual is ready 🍀',
    'Today\'s energy is in ✦',
    'Open your LuckyDay 🌙',
    'Your daily fortune is here ✨',
    'The almanac is ready 📖',
    'Luck is calling 🌸',
    'A new day, a new reading ✨',
    'Your morning ritual awaits 🌅',
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
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } finally {
    await AsyncStorage.removeItem(REMINDER_NOTIFICATION_KEY);
  }
}
