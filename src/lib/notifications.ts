import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_NOTIFICATION_KEY = 'luckyday.reminderNotificationId.v1';

export type ReminderSyncResult = 'disabled' | 'scheduled' | 'denied' | 'invalid' | 'unsupported';

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

export async function syncLocalDailyReminder(time?: string): Promise<ReminderSyncResult> {
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
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your LuckyDay is ready ✨',
      body: "Open today's luck energy, color, and number.",
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
