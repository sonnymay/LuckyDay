import { describe, expect, it } from 'vitest';
import {
  generateDailyReading,
  getChineseZodiac,
  getDailySeed,
  getMoonPhase,
  getWesternZodiac,
  pickFromArrayWithSeed,
} from './luck';
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
    expect(reading.score).toBeGreaterThanOrEqual(55);
    expect(reading.score).toBeLessThanOrEqual(92);
    expect(reading.goodFor.length).toBeGreaterThan(0);
    expect(reading.avoid.length).toBeGreaterThan(0);
    expect(reading.moonPhase).toBeTruthy();
    expect(reading.moonMessage).toBeTruthy();
    expect(reading.chineseZodiac).toBe('Rat');
    expect(reading.luckyNumber).toBeGreaterThanOrEqual(1);
    expect(reading.luckyNumber).toBeLessThanOrEqual(9);
  });

  it('supports more than one main focus', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const reading = generateDailyReading({ ...baseProfile, mainFocus: ['Money', 'Love', 'Work', 'Health', 'Luck'] }, date);

    expect(reading.goodFor.some((item) => ['money', 'love', 'work', 'health', 'luck'].includes(item))).toBe(true);
    expect(reading.avoid.length).toBeGreaterThan(0);
  });

  it('does not give identical readings to same-birthday users with different nicknames', () => {
    const date = new Date('2026-04-28T12:00:00.000Z');
    const maliReading = generateDailyReading(baseProfile, date);
    const nokReading = generateDailyReading({ ...baseProfile, id: 'other', nickname: 'Nok' }, date);

    expect(nokReading).not.toEqual(maliReading);
  });
});
