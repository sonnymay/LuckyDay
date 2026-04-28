import * as Notifications from 'expo-notifications';

export async function scheduleLocalDailyReminder(time?: string) {
  if (!time) {
    return null;
  }

  const [hourValue, minuteValue] = time.split(':').map(Number);
  if (!Number.isInteger(hourValue) || !Number.isInteger(minuteValue)) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'LuckyDay is ready',
      body: "Open today's luck guide.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hourValue,
      minute: minuteValue,
    },
  });
}
