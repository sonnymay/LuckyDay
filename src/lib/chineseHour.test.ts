import { describe, expect, it } from 'vitest';
import { formatDoubleHourChip, getCurrentDoubleHour } from './chineseHour';

describe('getCurrentDoubleHour', () => {
  // Each entry: hour-of-day → expected (name, animal). Spans 24 hours.
  const cases: Array<[number, string, string]> = [
    [0, '子时', 'Rat'],
    [1, '丑时', 'Ox'],
    [2, '丑时', 'Ox'],
    [3, '寅时', 'Tiger'],
    [4, '寅时', 'Tiger'],
    [5, '卯时', 'Rabbit'],
    [6, '卯时', 'Rabbit'],
    [7, '辰时', 'Dragon'],
    [8, '辰时', 'Dragon'],
    [9, '巳时', 'Snake'],
    [11, '午时', 'Horse'],
    [12, '午时', 'Horse'],
    [13, '未时', 'Goat'],
    [15, '申时', 'Monkey'],
    [17, '酉时', 'Rooster'],
    [19, '戌时', 'Dog'],
    [21, '亥时', 'Pig'],
    [23, '子时', 'Rat'],
  ];

  for (const [hour, expectedName, expectedAnimal] of cases) {
    it(`maps hour ${hour} to ${expectedName} (${expectedAnimal})`, () => {
      const dh = getCurrentDoubleHour(new Date(2026, 4, 14, hour, 30));
      expect(dh.name).toBe(expectedName);
      expect(dh.animal).toBe(expectedAnimal);
    });
  }
});

describe('formatDoubleHourChip', () => {
  it('formats the chip label', () => {
    const dh = { name: '申时', pinyin: 'Shēn shí', animal: 'Monkey', range: '3-5pm' };
    expect(formatDoubleHourChip(dh)).toBe('申时 · Monkey hour · 3-5pm');
  });
});
