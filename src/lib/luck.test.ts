import { describe, expect, it } from 'vitest';
import {
  generateDailyReading,
  getChineseZodiac,
  getDailySeed,
  getMoonPhase,
  getWesternZodiac,
  pickFromArrayWithSeed,
} from './luck';
import { getBirthYearElement } from './chineseZodiac';
import { Profile } from '../types';

const baseProfile: Profile = {
  id: 'test-profile',
  nickname: 'Mali',
  birthday: '1996-04-13',
  birthTime: '08:30',
  birthplace: 'Bangkok',
  mainFocus: ['Work'],
  notificationTime: '08:00',
  westernZodiac: 'Aries',
  chineseZodiac: 'Rat',
  photos: {
    faceUri: 'file://face.jpg',
    leftPalmUri: 'file://left.jpg',
    rightPalmUri: 'file://right.jpg',
    handwritingUri: 'file://handwriting.jpg',
  },
  photoTimestamps: {
    faceUpdatedAt: '2026-04-28T00:00:00.000Z',
    leftPalmUpdatedAt: '2026-04-28T00:00:00.000Z',
    rightPalmUpdatedAt: '2026-04-28T00:00:00.000Z',
    handwritingUpdatedAt: '2026-04-28T00:00:00.000Z',
  },
  mediaConsentAt: '2026-04-28T00:00:00.000Z',
  createdAt: '2026-04-28T00:00:00.000Z',
};

describe('luck helpers', () => {
  it('maps Chinese zodiac years from birthday', () => {
    expect(getChineseZodiac('1996-04-13')).toBe('Rat');
    expect(getChineseZodiac('1997-04-13')).toBe('Ox');
    expect(getChineseZodiac('2000-04-13')).toBe('Dragon');
  });

  it('uses Lunar New Year boundaries for Chinese zodiac', () => {
    expect(getChineseZodiac('1997-02-06')).toBe('Rat');
    expect(getChineseZodiac('1997-02-07')).toBe('Ox');
    expect(getChineseZodiac('2000-02-04')).toBe('Rabbit');
    expect(getChineseZodiac('2000-02-05')).toBe('Dragon');
    expect(getChineseZodiac('2024-02-09')).toBe('Rabbit');
    expect(getChineseZodiac('2024-02-10')).toBe('Dragon');
  });

  it('maps birth years to the correct Five Element cycle', () => {
    expect(getBirthYearElement('1996-04-13')).toBe('Fire');
    expect(getBirthYearElement('1984-01-01')).toBe('Wood');
    expect(getBirthYearElement('2000-04-13')).toBe('Metal');
  });

  it('maps Western zodiac boundary dates', () => {
    expect(getWesternZodiac('1996-03-21')).toBe('Aries');
    expect(getWesternZodiac('1996-04-19')).toBe('Aries');
    expect(getWesternZodiac('1996-04-20')).toBe('Taurus');
    expect(getWesternZodiac('1996-12-22')).toBe('Capricorn');
  });

  it('uses nickname, birthday, and date in the daily seed', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const sameSeed = getDailySeed(baseProfile, date);
    const differentNicknameSeed = getDailySeed({ ...baseProfile, nickname: 'Nok' }, date);
    const differentDateSeed = getDailySeed(baseProfile, new Date('2026-04-29T12:00:00.000Z'));

    expect(getDailySeed(baseProfile, date)).toBe(sameSeed);
    expect(differentNicknameSeed).not.toBe(sameSeed);
    expect(differentDateSeed).not.toBe(sameSeed);
  });

  it('changes luck energy when the local calendar day changes', () => {
    const todayReading = generateDailyReading(baseProfile, new Date(2026, 3, 28, 23, 30));
    const tomorrowReading = generateDailyReading(baseProfile, new Date(2026, 3, 29, 0, 30));

    expect(todayReading.date).toBe('2026-04-28');
    expect(tomorrowReading.date).toBe('2026-04-29');
    expect(tomorrowReading.score).not.toBe(todayReading.score);
  });

  it('picks deterministic array values with a seed', () => {
    const choices = ['green', 'gold', 'red'];

    expect(pickFromArrayWithSeed(choices, 42)).toBe(pickFromArrayWithSeed(choices, 42));
    expect(choices).toContain(pickFromArrayWithSeed(choices, 42, 2));
  });

  it('maps dates to stable moon phases', () => {
    expect(getMoonPhase(new Date('2000-01-06T18:14:00.000Z'))).toBe('New Moon');
    expect(getMoonPhase(new Date('2000-01-21T12:00:00.000Z'))).toBe('Full Moon');
  });

  it('generates stable daily readings in the expected shape', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const reading = generateDailyReading(baseProfile, date);

    expect(generateDailyReading(baseProfile, date)).toEqual(reading);
    expect(reading.date).toBe('2026-04-28');
    expect(reading.score).toBeGreaterThanOrEqual(50);
    expect(reading.score).toBeLessThanOrEqual(96);
    // goodFor and avoid come from the real Chinese almanac for this calendar date
    expect(reading.goodFor.length).toBeGreaterThan(0);
    expect(reading.avoid.length).toBeGreaterThan(0);
    expect(reading.goodFor.every((item) => typeof item === 'string' && item.length > 0)).toBe(true);
    expect(reading.avoid.every((item) => typeof item === 'string' && item.length > 0)).toBe(true);
    // lunarDate is populated by the almanac module
    expect(typeof reading.lunarDate).toBe('string');
    expect(reading.moonPhase).toBeTruthy();
    expect(reading.moonMessage).toBeTruthy();
    expect(reading.chineseZodiac).toBe('Rat');
    expect(reading.zodiacElement).toBe('Fire');
    expect(reading.westernZodiac).toBe('Aries');
    expect(typeof reading.westernZodiacInsight).toBe('string');
    expect(reading.westernZodiacInsight.length).toBeGreaterThan(0);
    expect(reading.luckyNumber).toBeGreaterThanOrEqual(1);
    expect(reading.luckyNumber).toBeLessThanOrEqual(9);
    expect([2, 3]).toContain(reading.luckyNumber);
  });

  it('almanac goodFor and avoid are shared across users on the same date', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const maliReading = generateDailyReading(baseProfile, date);
    const nokReading = generateDailyReading({ ...baseProfile, id: 'other', nickname: 'Nok' }, date);

    // Almanac data is date-based (same for everyone on a given day), not user-specific
    expect(maliReading.goodFor).toEqual(nokReading.goodFor);
    expect(maliReading.avoid).toEqual(nokReading.avoid);
    expect(maliReading.lunarDate).toEqual(nokReading.lunarDate);
  });

  it('supports more than one main focus', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const reading = generateDailyReading({ ...baseProfile, mainFocus: ['Money', 'Love', 'Work', 'Health', 'Luck'] }, date);

    // goodFor comes from the almanac — check it has content regardless of mainFocus
    expect(reading.goodFor.length).toBeGreaterThan(0);
    expect(reading.avoid.length).toBeGreaterThan(0);
  });

  it('does not give identical readings to same-birthday users with different nicknames', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const maliReading = generateDailyReading(baseProfile, date);
    const nokReading = generateDailyReading({ ...baseProfile, id: 'other', nickname: 'Nok' }, date);

    // Score, message, lucky color/number/direction remain personalized by seed
    expect(nokReading.score).not.toBe(maliReading.score);
    expect(nokReading.mainMessage).not.toBe(maliReading.mainMessage);
  });

  it('avoids repeating the same warning on consecutive days for the same user', () => {
    for (let day = 1; day < 20; day += 1) {
      const today = generateDailyReading(baseProfile, new Date(2026, 4, day, 12));
      const tomorrow = generateDailyReading(baseProfile, new Date(2026, 4, day + 1, 12));

      expect(tomorrow.warning).not.toBe(today.warning);
    }
  });

  it('uses solar-term context for seasonal actions', () => {
    const reading = generateDailyReading(baseProfile, new Date('2026-05-05T12:00:00.000Z'));

    expect(reading.solarTerm).toBe('Start of Summer');
    expect(reading.action).toMatch(/Start of Summer|sunlight|water|lively/);
  });

  it('score is always an integer within the 50–96 range across a sample of dates', () => {
    for (let day = 1; day <= 28; day += 1) {
      const reading = generateDailyReading(baseProfile, new Date(2026, 0, day, 12));
      expect(reading.score).toBeGreaterThanOrEqual(50);
      expect(reading.score).toBeLessThanOrEqual(96);
      expect(Number.isInteger(reading.score)).toBe(true);
    }
  });

  it('same profile and date always produce the same score (deterministic)', () => {
    const date = new Date('2026-06-15T12:00:00.000Z');
    const r1 = generateDailyReading(baseProfile, date);
    const r2 = generateDailyReading(baseProfile, date);
    expect(r1.score).toBe(r2.score);
    expect(r1.mainMessage).toBe(r2.mainMessage);
    expect(r1.luckyColor).toBe(r2.luckyColor);
  });
});
