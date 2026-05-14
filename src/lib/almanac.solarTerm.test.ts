import { describe, expect, it } from 'vitest';
import { formatNextSolarTermHint, getNextSolarTerm } from './almanac';

describe('getNextSolarTerm', () => {
  it('returns a NextSolarTerm for a regular day in the year', () => {
    // May 14 2026 — not a solar term day, so the next one is Grain Buds on May 21 2026.
    const result = getNextSolarTerm(new Date(2026, 4, 14));
    expect(result).not.toBeNull();
    if (result) {
      expect(result.label).toBe('Grain Buds');
      expect(result.daysAway).toBeGreaterThan(0);
      expect(result.daysAway).toBeLessThanOrEqual(16); // 24 terms over ~365 days
    }
  });

  it('returns daysAway 0 when today is a solar term', () => {
    // May 5 2026 — Start of Summer lands on this date.
    const result = getNextSolarTerm(new Date(2026, 4, 5));
    expect(result).not.toBeNull();
    if (result) {
      expect(result.daysAway).toBe(0);
      expect(result.label).toBe('Start of Summer');
    }
  });
});

describe('formatNextSolarTermHint', () => {
  it('returns null when input is null', () => {
    expect(formatNextSolarTermHint(null)).toBeNull();
  });

  it('formats today', () => {
    expect(formatNextSolarTermHint({ label: 'Start of Summer', daysAway: 0 })).toBe(
      'Start of Summer begins today',
    );
  });

  it('formats singular day', () => {
    expect(formatNextSolarTermHint({ label: 'Grain Buds', daysAway: 1 })).toBe(
      '1 day until Grain Buds',
    );
  });

  it('formats plural days', () => {
    expect(formatNextSolarTermHint({ label: 'Grain Buds', daysAway: 7 })).toBe(
      '7 days until Grain Buds',
    );
  });
});
