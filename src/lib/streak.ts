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

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

/**
 * Returns milestone info if the given streak count is a celebration milestone.
 * Returns null if the streak is not at a milestone.
 */
export function getStreakMilestone(streak: number): { days: number; emoji: string; message: string } | null {
  if (!STREAK_MILESTONES.includes(streak)) {
    return null;
  }

  const milestones: Record<number, { emoji: string; message: string }> = {
    7: { emoji: '🌟', message: 'One full week of daily luck. Your ritual is real now.' },
    14: { emoji: '🔥', message: 'Two weeks straight. Your morning has a new shape.' },
    30: { emoji: '🌕', message: 'One full moon cycle of daily intention. That is rare.' },
    60: { emoji: '🏮', message: 'Two months of showing up. The almanac sees your devotion.' },
    100: { emoji: '👑', message: '100 days. You are not someone who starts — you are someone who continues.' },
  };

  const data = milestones[streak];
  return data ? { days: streak, ...data } : null;
}

/** Returns true if the app rating prompt should be shown (at the 7-day milestone). */
export function shouldRequestRating(streak: number): boolean {
  return streak === 7;
}

/**
 * Returns the next milestone target above the current streak, or null if
 * the user has passed all milestones.
 */
export function getNextMilestoneTarget(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null;
}
