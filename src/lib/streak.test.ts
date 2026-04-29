import { describe, expect, it } from 'vitest';
import { getMonthActivity, getReadingStreak } from './streak';

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
