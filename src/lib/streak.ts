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

export type MonthActivityDay = {
  date: string;
  day: number;
  hasReading: boolean;
  isToday: boolean;
};

export function getMonthActivity(history: Pick<DailyReading, 'date'>[], date = new Date()): MonthActivityDay[] {
  const dates = new Set(history.map((item) => item.date));
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayKey(date);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = todayKey(new Date(year, month, day));

    return {
      date: dateKey,
      day,
      hasReading: dates.has(dateKey),
      isToday: dateKey === today,
    };
  });
}

function previousDateKey(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}
