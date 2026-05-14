import { describe, expect, it } from 'vitest';
import { formatAuspiciousBadgeLabel, getAuspiciousDay } from './auspiciousDay';

describe('getAuspiciousDay', () => {
  it('returns null on invalid date (lib throws, helper catches)', () => {
    expect(getAuspiciousDay(new Date(NaN))).toBeNull();
  });

  it('returns either null or one of the 6 named auspicious days for any real date', () => {
    // Sweep every day of one month — each result must be either null
    // (inauspicious day, not displayed) or one of our 6 English names.
    const allowed = new Set([
      'Green Dragon',
      'Bright Hall',
      'Golden Vault',
      'Heavenly Virtue',
      'Jade Hall',
      'Master of Destiny',
    ]);
    for (let d = 1; d <= 28; d++) {
      const info = getAuspiciousDay(new Date(2026, 4, d));
      if (info !== null) {
        expect(allowed.has(info.name)).toBe(true);
        expect(info.meaning.length).toBeGreaterThan(0);
      }
    }
  });

  it('over a full year, every English name appears at least once', () => {
    // Statistically across 365 days each of the 12 day-gods appears ~30
    // times, so all 6 auspicious names must surface within a year.
    const seen = new Set<string>();
    for (let d = 0; d < 365; d++) {
      const date = new Date(2026, 0, 1);
      date.setDate(date.getDate() + d);
      const info = getAuspiciousDay(date);
      if (info) seen.add(info.name);
    }
    expect(seen.size).toBe(6);
  });

  it('is deterministic — same date returns same result', () => {
    const date = new Date(2026, 4, 14);
    expect(getAuspiciousDay(date)).toEqual(getAuspiciousDay(date));
  });
});

describe('formatAuspiciousBadgeLabel', () => {
  it('returns null when input is null', () => {
    expect(formatAuspiciousBadgeLabel(null)).toBeNull();
  });

  it('formats the badge label', () => {
    expect(
      formatAuspiciousBadgeLabel({ name: 'Green Dragon', meaning: 'Bold moves are favored.' }),
    ).toBe('Auspicious day · Green Dragon');
  });
});
