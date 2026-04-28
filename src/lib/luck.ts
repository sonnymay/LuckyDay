import { DailyReading, MainFocus, Profile, ProfileInput } from '../types';
import { todayKey } from './date';

const chineseZodiac = [
  'Rat',
  'Ox',
  'Tiger',
  'Rabbit',
  'Dragon',
  'Snake',
  'Horse',
  'Goat',
  'Monkey',
  'Rooster',
  'Dog',
  'Pig',
];

const focusGoodFor: Record<MainFocus, string[]> = {
  Money: ['saving money', 'checking bills', 'small plans'],
  Love: ['kind words', 'slow replies', 'listening'],
  Work: ['work', 'planning', 'finishing old tasks'],
  Health: ['rest', 'simple food', 'quiet movement'],
  Luck: ['trying once', 'asking for help', 'clean starts'],
};

const avoidByFocus: Record<MainFocus, string[]> = {
  Money: ['impulse spending', 'risky deals', 'showing off'],
  Love: ['cold messages', 'testing people', 'old arguments'],
  Work: ['rushing', 'office gossip', 'late starts'],
  Health: ['skipping meals', 'too much screen time', 'heavy plans'],
  Luck: ['forcing things', 'lending money', 'angry choices'],
};

const mainMessages = [
  'Today is good for finishing old tasks.',
  'Move slowly and choose the simple path.',
  'Your luck improves when you speak clearly.',
  'A quiet morning can bring a better day.',
  'Small careful choices help you today.',
  'Keep your plans light and your words kind.',
  'Good timing matters more than speed today.',
  'Listen first. Decide after you feel calm.',
];

const moneyReadings = [
  'Save money today. Avoid buying things you do not need.',
  'Check one small money detail before you spend.',
  'A simple plan is better than a risky move today.',
  'Good day to compare prices and wait.',
  'Keep receipts and avoid lending money today.',
];

const loveReadings = [
  'Speak gently. A short kind message can help.',
  'Do not reply too fast when you feel annoyed.',
  'Listen more than you explain today.',
  'Small care matters more than big promises.',
  'Give people space if the mood feels heavy.',
];

const workReadings = [
  'Finish one old task before starting a new one.',
  'Good day for planning, notes, and clean follow-up.',
  'Ask a clear question if something feels stuck.',
  'Avoid gossip. Let your work speak first.',
  'Your best progress comes from a simple list.',
];

const healthReadings = [
  'Eat simple food and drink more water.',
  'Take a short walk if your mind feels busy.',
  'Rest your eyes and keep the evening calm.',
  'Do not ignore small body signals today.',
  'Choose steady energy over pushing too hard.',
];

const warnings = [
  'Speak less today. Watch how people act.',
  'Avoid arguing when the answer can wait.',
  'Do not rush money or love decisions.',
  'Keep your phone away when you feel annoyed.',
  'A late plan may change. Stay flexible.',
  'Double-check times, names, and small details.',
];

const actions = [
  'Finish one small task before noon.',
  'Wear your lucky color today.',
  'Clean one corner of your room or desk.',
  'Send one helpful message.',
  'Write down the thing you want to protect.',
  'Wait ten minutes before saying yes.',
  'Put one coin or bill aside for saving.',
];

const luckyColors = ['Green', 'White', 'Gold', 'Blue', 'Red', 'Black', 'Pink', 'Yellow', 'Silver'];
const luckyDirections = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
const luckyTimes = ['7 AM - 9 AM', '9 AM - 11 AM', '11 AM - 1 PM', '1 PM - 3 PM', '3 PM - 5 PM', '6 PM - 8 PM'];
const goodForPool = ['work', 'planning', 'saving money', 'family calls', 'cleaning', 'study', 'short trips'];
const avoidPool = ['arguing', 'impulse spending', 'late replies', 'big promises', 'rushing', 'gossip', 'heavy food'];

export function getChineseZodiac(birthday: string) {
  const year = new Date(`${birthday}T00:00:00`).getFullYear();
  const index = ((year - 1900) % 12 + 12) % 12;
  return chineseZodiac[index];
}

export function getWesternZodiac(birthday: string) {
  const date = new Date(`${birthday}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

export function createProfile(input: ProfileInput): Profile {
  const birthday = input.birthday.trim();
  return {
    id: hashString(`${input.nickname}-${birthday}-${Date.now()}`).toString(16),
    nickname: input.nickname.trim(),
    birthday,
    birthTime: input.birthTime?.trim(),
    birthplace: input.birthplace?.trim(),
    mainFocus: input.mainFocus,
    notificationTime: input.notificationTime?.trim(),
    westernZodiac: getWesternZodiac(birthday),
    chineseZodiac: getChineseZodiac(birthday),
    photos: input.photos,
    createdAt: new Date().toISOString(),
  };
}

export function getDailySeed(profile: Pick<Profile, 'nickname' | 'birthday'>, date = new Date()) {
  return hashString(`${profile.nickname.toLowerCase()}|${profile.birthday}|${todayKey(date)}`);
}

export function pickFromArrayWithSeed<T>(array: T[], seed: number, offset = 0) {
  return array[Math.abs(seed + offset * 9973) % array.length];
}

export function generateDailyReading(profile: Profile, date = new Date()): DailyReading {
  const seed = getDailySeed(profile, date);
  const day = date.getDay();
  const zodiacBias = profile.chineseZodiac.length + profile.westernZodiac.length;
  const focusGood = focusGoodFor[profile.mainFocus];
  const focusAvoid = avoidByFocus[profile.mainFocus];
  const score = 55 + (Math.abs(seed + day + zodiacBias) % 38);

  return {
    date: todayKey(date),
    score,
    mainMessage: pickFromArrayWithSeed(mainMessages, seed, day),
    goodFor: unique([
      profile.mainFocus.toLowerCase(),
      pickFromArrayWithSeed(focusGood, seed, 1),
      pickFromArrayWithSeed(goodForPool, seed, 2),
    ]).slice(0, 3),
    avoid: unique([
      pickFromArrayWithSeed(focusAvoid, seed, 3),
      pickFromArrayWithSeed(avoidPool, seed, 4),
    ]).slice(0, 2),
    luckyNumber: 1 + (Math.abs(seed + zodiacBias) % 9),
    luckyColor: pickFromArrayWithSeed(luckyColors, seed, 5),
    luckyTime: pickFromArrayWithSeed(luckyTimes, seed, 6),
    luckyDirection: pickFromArrayWithSeed(luckyDirections, seed, 7),
    money: pickFromArrayWithSeed(moneyReadings, seed, 8),
    love: pickFromArrayWithSeed(loveReadings, seed, 9),
    work: pickFromArrayWithSeed(workReadings, seed, 10),
    health: pickFromArrayWithSeed(healthReadings, seed, 11),
    warning: pickFromArrayWithSeed(warnings, seed, 12),
    action: pickFromArrayWithSeed(actions, seed, 13),
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
