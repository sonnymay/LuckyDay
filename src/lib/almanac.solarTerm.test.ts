import { describe, expect, it } from 'vitest';
import { formatNextSolarTermHint, getNextSolarTerm } from './almanac';

describe('getNextSolarTerm', () => {
  it('returns a NextSolarTerm for a regular day in the year', () => {
    // May 14 2026 — not a solar term day, so the next one is Grain Buds (小满) on May 21 2026.
    const result = getNextSolarTerm(new Date(2026, 4, 14));
    expect(result).not.toBeNull();
    if (result) {
      expect(result.label).toContain('小满');
      expect(result.label).toContain('Grain Buds');
      expect(result.daysAway).toBeGreaterThan(0);
      expect(result.daysAway).toBeLessThanOrEqual(16); // 24 terms over ~365 days
    }
  });

  it('returns daysAway 0 when today is a solar term', () => {
    // May 5 2026 — 立夏 (Start of Summer) lands on this date.
    const result = getNextSolarTerm(new Date(2026, 4, 5));
    expect(result).not.toBeNull();
    if (result) {
      expect(result.daysAway).toBe(0);
      expect(result.label).toContain('立夏');
    }
  });
});

describe('formatNextSolarTermHint', () => {
  it('returns null when input is null', () => {
    expect(formatNextSolarTermHint(null)).toBeNull();
  });

  it('formats today', () => {
    expect(formatNextSolarTermHint({ label: '立夏 · Start of Summer', daysAway: 0 })).toBe(
      '立夏 · Start of Summer begins today',
    );
  });

  it('formats singular day', () => {
    expect(formatNextSolarTermHint({ label: '小满 · Grain Buds', daysAway: 1 })).toBe(
      '1 day until 小满 · Grain Buds',
    );
  });

  it('formats plural days', () => {
    expect(formatNextSolarTermHint({ label: '小满 · Grain Buds', daysAway: 7 })).toBe(
      '7 days until 小满 · Grain Buds',
    );
  });
});
