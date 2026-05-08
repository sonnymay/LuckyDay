import { describe, expect, it } from 'vitest';
import { getMonthActivity, getNextMilestoneTarget, getReadingStreak, getStreakMilestone, shouldRequestRating } from './streak';

describe('reading streak', () => {
  it('counts consecutive readings ending today', () => {
    const date = new Date('2026-04-29T12:00:00.000Z');

    expect(getReadingStreak([
      { date: '2026-04-29' },
      { date: '2026-04-28' },
      { date: '2026-04-27' },
    ], date)).toBe(3);
  });

  it('stops at the first missing day', () => {
    const date = new Date('2026-04-29T12:00:00.000Z');

    expect(getReadingStreak([
      { date: '2026-04-29' },
      { date: '2026-04-27' },
    ], date)).toBe(1);
  });

  it('returns zero when today is missing', () => {
    const date = new Date('2026-04-29T12:00:00.000Z');

    expect(getReadingStreak([{ date: '2026-04-28' }], date)).toBe(0);
  });

  it('builds month activity for reading days', () => {
    const date = new Date('2026-04-29T12:00:00.000Z');
    const activity = getMonthActivity([
      { date: '2026-04-01' },
      { date: '2026-04-29' },
    ], date);

    expect(activity).toHaveLength(30);
    expect(activity[0]).toEqual({
      date: '2026-04-01',
      day: 1,
      hasReading: true,
      isToday: false,
    });
    expect(activity[28]).toEqual({
      date: '2026-04-29',
      day: 29,
      hasReading: true,
      isToday: true,
    });
  });
});

describe('streak break behavior', () => {
  it('breaks when a day is skipped (gap > 1 day)', () => {
    const date = new Date('2026-04-29T12:00:00');
    // 2026-04-29, then gap, then 2026-04-27 — streak is 1 (only today counts)
    expect(getReadingStreak([
      { date: '2026-04-29' },
      { date: '2026-04-27' },
    ], date)).toBe(1);
  });

  it('counts only today when there is no prior consecutive day', () => {
    const date = new Date('2026-04-29T12:00:00');
    expect(getReadingStreak([{ date: '2026-04-29' }], date)).toBe(1);
  });

  it('same-day idempotency — duplicate entries do not inflate the streak', () => {
    const date = new Date('2026-04-29T12:00:00');
    // Two entries for the same date: Set deduplicates, streak should be 2 days
    expect(getReadingStreak([
      { date: '2026-04-29' },
      { date: '2026-04-29' },
      { date: '2026-04-28' },
    ], date)).toBe(2);
  });

  it('returns zero for an empty history', () => {
    const date = new Date('2026-04-29T12:00:00');
    expect(getReadingStreak([], date)).toBe(0);
  });

  it('handles a long unbroken streak correctly', () => {
    const date = new Date('2026-04-29T12:00:00');
    const history = Array.from({ length: 10 }, (_, i) => {
      const d = new Date('2026-04-29T12:00:00');
      d.setDate(d.getDate() - i);
      return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` };
    });
    expect(getReadingStreak(history, date)).toBe(10);
  });
});

describe('getStreakMilestone', () => {
  it('returns milestone data at exactly 7 days', () => {
    const result = getStreakMilestone(7);
    expect(result).not.toBeNull();
    expect(result?.days).toBe(7);
    expect(typeof result?.emoji).toBe('string');
    expect(typeof result?.message).toBe('string');
  });

  it('returns milestone data at all defined milestones', () => {
    for (const days of [7, 14, 30, 60, 100]) {
      expect(getStreakMilestone(days)).not.toBeNull();
    }
  });

  it('returns null for non-milestone streaks', () => {
    expect(getStreakMilestone(1)).toBeNull();
    expect(getStreakMilestone(6)).toBeNull();
    expect(getStreakMilestone(8)).toBeNull();
    expect(getStreakMilestone(50)).toBeNull();
  });

  it('returns null for streaks beyond the last milestone', () => {
    expect(getStreakMilestone(101)).toBeNull();
    expect(getStreakMilestone(200)).toBeNull();
  });
});

describe('shouldRequestRating', () => {
  it('returns true only at 7-day streak', () => {
    expect(shouldRequestRating(7)).toBe(true);
  });

  it('returns false for other streak values', () => {
    expect(shouldRequestRating(6)).toBe(false);
    expect(shouldRequestRating(8)).toBe(false);
    expect(shouldRequestRating(14)).toBe(false);
    expect(shouldRequestRating(0)).toBe(false);
  });
});

describe('getNextMilestoneTarget', () => {
  it('returns the next milestone above the current streak', () => {
    expect(getNextMilestoneTarget(0)).toBe(7);
    expect(getNextMilestoneTarget(6)).toBe(7);
    expect(getNextMilestoneTarget(7)).toBe(14);
    expect(getNextMilestoneTarget(13)).toBe(14);
    expect(getNextMilestoneTarget(30)).toBe(60);
  });

  it('returns null once all milestones are passed', () => {
    expect(getNextMilestoneTarget(100)).toBeNull();
    expect(getNextMilestoneTarget(150)).toBeNull();
  });
});
