import { describe, expect, it } from 'vitest';
import { getAlmanacDay } from './almanac';

describe('getAlmanacDay', () => {
  it('returns a lunarDate string in Chinese month+day format', () => {
    const result = getAlmanacDay(new Date('2026-04-28T12:00:00'));
    // Format: "<month>月<day>" where both parts are Chinese characters
    expect(typeof result.lunarDate).toBe('string');
    expect(result.lunarDate).toMatch(/月/);
    expect(result.lunarDate.length).toBeGreaterThan(2);
  });

  it('returns arrays for goodFor and avoid that are non-empty English strings', () => {
    const result = getAlmanacDay(new Date('2026-04-28T12:00:00'));
    expect(result.goodFor.length).toBeGreaterThan(0);
    expect(result.avoid.length).toBeGreaterThan(0);
    expect(result.goodFor.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
    expect(result.avoid.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
  });

  it('caps goodFor and avoid at 3 items each', () => {
    const result = getAlmanacDay(new Date('2026-04-28T12:00:00'));
    expect(result.goodFor.length).toBeLessThanOrEqual(3);
    expect(result.avoid.length).toBeLessThanOrEqual(3);
  });

  it('is deterministic — same date produces same output', () => {
    const date = new Date('2026-05-05T12:00:00');
    expect(getAlmanacDay(date)).toEqual(getAlmanacDay(date));
  });

  it('returns a solar term on a known 节气 date (立夏 — Start of Summer 2026-05-05)', () => {
    const result = getAlmanacDay(new Date('2026-05-05T12:00:00'));
    expect(result.solarTerm).toBeDefined();
    expect(result.solarTerm).toContain('立夏');
    expect(result.solarTerm).toContain('Start of Summer');
  });

  it('returns undefined solarTerm on an ordinary day between solar terms', () => {
    // 2026-04-28 is between 谷雨 (Apr 20) and 立夏 (May 5)
    const result = getAlmanacDay(new Date('2026-04-28T12:00:00'));
    expect(result.solarTerm).toBeUndefined();
  });

  it('solar term label includes both Chinese and English separated by " · "', () => {
    const result = getAlmanacDay(new Date('2026-05-05T12:00:00'));
    expect(result.solarTerm).toMatch(/^.+ · .+$/);
  });

  it('produces different lunarDate values for different Gregorian dates', () => {
    const a = getAlmanacDay(new Date('2026-04-28T12:00:00'));
    const b = getAlmanacDay(new Date('2026-04-29T12:00:00'));
    expect(a.lunarDate).not.toBe(b.lunarDate);
  });

  it('gracefully falls back when given an invalid date (no throw)', () => {
    // new Date(NaN) triggers the catch block — expect the fallback shape
    const result = getAlmanacDay(new Date(NaN));
    expect(result.lunarDate).toBe('');
    expect(result.solarTerm).toBeUndefined();
    expect(result.goodFor).toEqual(['Quiet reflection', 'Rest']);
    expect(result.avoid).toEqual(['Rushing decisions']);
  });

  it('returns consistent almanac data across multiple calls on the same date', () => {
    const date = new Date('2026-03-20T12:00:00');
    const first = getAlmanacDay(date);
    const second = getAlmanacDay(date);
    expect(first).toEqual(second);
  });
});
