/**
 * Chinese double-hour (時辰) — the 12 ancient 2-hour periods that traditional
 * almanacs use instead of the Western 24-hour clock. Each period is paired
 * with one of the 12 zodiac animals.
 *
 * Used by the detail screen to render a small cultural chip showing the
 * current period: e.g. "申时 · Monkey · 3-5pm".
 */

export interface DoubleHour {
  /** Chinese name, e.g. "子时" */
  name: string;
  /** Pinyin with tone mark, e.g. "Zǐ shí" */
  pinyin: string;
  /** Paired zodiac animal, e.g. "Rat" */
  animal: string;
  /** Human-readable hour range, e.g. "11pm-1am" */
  range: string;
}

/**
 * The 12 double-hours, indexed by their starting hour-of-day.
 * 子时 spans 23:00-01:00 so it's stored with startHour = 23 and treated as
 * the special wrap-around case in `getCurrentDoubleHour`.
 */
const DOUBLE_HOURS: ReadonlyArray<DoubleHour & { startHour: number }> = [
  { startHour: 23, name: '子时', pinyin: 'Zǐ shí', animal: 'Rat', range: '11pm-1am' },
  { startHour: 1, name: '丑时', pinyin: 'Chǒu shí', animal: 'Ox', range: '1-3am' },
  { startHour: 3, name: '寅时', pinyin: 'Yín shí', animal: 'Tiger', range: '3-5am' },
  { startHour: 5, name: '卯时', pinyin: 'Mǎo shí', animal: 'Rabbit', range: '5-7am' },
  { startHour: 7, name: '辰时', pinyin: 'Chén shí', animal: 'Dragon', range: '7-9am' },
  { startHour: 9, name: '巳时', pinyin: 'Sì shí', animal: 'Snake', range: '9-11am' },
  { startHour: 11, name: '午时', pinyin: 'Wǔ shí', animal: 'Horse', range: '11am-1pm' },
  { startHour: 13, name: '未时', pinyin: 'Wèi shí', animal: 'Goat', range: '1-3pm' },
  { startHour: 15, name: '申时', pinyin: 'Shēn shí', animal: 'Monkey', range: '3-5pm' },
  { startHour: 17, name: '酉时', pinyin: 'Yǒu shí', animal: 'Rooster', range: '5-7pm' },
  { startHour: 19, name: '戌时', pinyin: 'Xū shí', animal: 'Dog', range: '7-9pm' },
  { startHour: 21, name: '亥时', pinyin: 'Hài shí', animal: 'Pig', range: '9-11pm' },
];

/**
 * Returns the current double-hour for `now`. Pure function — `now` is
 * injected for testability.
 */
export function getCurrentDoubleHour(now: Date): DoubleHour {
  const hour = now.getHours();
  // 子时 wraps midnight (23-01).
  if (hour === 23 || hour === 0) {
    return stripIndex(DOUBLE_HOURS[0]);
  }
  // For the rest, find the period whose [startHour, startHour+2) contains hour.
  for (let i = 1; i < DOUBLE_HOURS.length; i++) {
    const entry = DOUBLE_HOURS[i];
    if (hour >= entry.startHour && hour < entry.startHour + 2) {
      return stripIndex(entry);
    }
  }
  // Defensive — shouldn't reach (all 24 hours covered).
  return stripIndex(DOUBLE_HOURS[0]);
}

function stripIndex(entry: DoubleHour & { startHour: number }): DoubleHour {
  return {
    name: entry.name,
    pinyin: entry.pinyin,
    animal: entry.animal,
    range: entry.range,
  };
}

/** Compact label for the chip. */
export function formatDoubleHourChip(dh: DoubleHour): string {
  return `${dh.name} · ${dh.animal} hour · ${dh.range}`;
}
