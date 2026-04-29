import { DailyReading } from '../types';
import { todayKey } from './date';

export function getReadingStreak(history: Pick<DailyReading, 'date'>[], date = new Date()) {
  const dates = new Set(history.map((item) => item.date));
  let streak = 0;
  let cursor = todayKey(date);

  while (dates.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }

  return streak;
}

function previousDateKey(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}
