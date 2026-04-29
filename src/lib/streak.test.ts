import { describe, expect, it } from 'vitest';
import { getReadingStreak } from './streak';

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
});
