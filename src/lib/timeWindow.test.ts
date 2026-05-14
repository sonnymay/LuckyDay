import { describe, expect, it } from 'vitest';
import { formatWindowHint, getWindowState, parseTimeWindow } from './timeWindow';

describe('parseTimeWindow', () => {
  it('parses morning AM window', () => {
    expect(parseTimeWindow('6 AM - 8 AM')).toEqual({ startHour: 6, endHour: 8 });
  });

  it('parses straddle window across noon', () => {
    expect(parseTimeWindow('10 AM - 12 PM')).toEqual({ startHour: 10, endHour: 12 });
  });

  it('parses PM window', () => {
    expect(parseTimeWindow('5 PM - 7 PM')).toEqual({ startHour: 17, endHour: 19 });
  });

  it('handles extra whitespace', () => {
    expect(parseTimeWindow('  7AM-9AM  ')).toEqual({ startHour: 7, endHour: 9 });
  });

  it('rejects malformed input', () => {
    expect(parseTimeWindow('5pm-7pm garbage')).toBeNull();
    expect(parseTimeWindow('25 AM - 26 AM')).toBeNull();
    expect(parseTimeWindow('7 PM - 5 PM')).toBeNull(); // end <= start
    expect(parseTimeWindow('')).toBeNull();
  });
});

describe('getWindowState', () => {
  const parsed = { startHour: 17, endHour: 19 }; // 5 PM - 7 PM

  it('returns before with minutes-until when now is earlier', () => {
    const now = new Date(2026, 4, 14, 16, 30); // 4:30 PM
    expect(getWindowState(parsed, now)).toEqual({ state: 'before', minutesUntilStart: 30 });
  });

  it('returns active with progress 0 at exact start', () => {
    const now = new Date(2026, 4, 14, 17, 0);
    const state = getWindowState(parsed, now);
    expect(state.state).toBe('active');
    if (state.state === 'active') expect(state.progress).toBe(0);
  });

  it('returns active with progress 0.5 at midpoint', () => {
    const now = new Date(2026, 4, 14, 18, 0);
    const state = getWindowState(parsed, now);
    expect(state.state).toBe('active');
    if (state.state === 'active') expect(state.progress).toBeCloseTo(0.5);
  });

  it('returns after at end-time boundary', () => {
    const now = new Date(2026, 4, 14, 19, 0);
    expect(getWindowState(parsed, now)).toEqual({ state: 'after', minutesSinceEnd: 0 });
  });

  it('returns after with elapsed minutes when past', () => {
    const now = new Date(2026, 4, 14, 20, 47);
    expect(getWindowState(parsed, now)).toEqual({ state: 'after', minutesSinceEnd: 107 });
  });
});

describe('formatWindowHint', () => {
  it('returns null for active', () => {
    expect(formatWindowHint({ state: 'active', progress: 0.4 })).toBeNull();
  });

  it('formats minutes-only when under an hour', () => {
    expect(formatWindowHint({ state: 'before', minutesUntilStart: 47 })).toBe('Starts in 47m');
    expect(formatWindowHint({ state: 'after', minutesSinceEnd: 23 })).toBe('Ended 23m ago');
  });

  it('formats hours and minutes', () => {
    expect(formatWindowHint({ state: 'before', minutesUntilStart: 134 })).toBe('Starts in 2h 14m');
    expect(formatWindowHint({ state: 'after', minutesSinceEnd: 65 })).toBe('Ended 1h 5m ago');
  });
});
