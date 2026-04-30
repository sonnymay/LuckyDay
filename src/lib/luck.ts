import { DailyReading, MainFocus, Profile, ProfileInput } from '../types';
import { chineseZodiacAnimals } from './chineseZodiac';
import { todayKey } from './date';

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
  // General energy
  'Your energy is quiet and strong today. Use it wisely.',
  'Something small you do this morning will matter more than it looks.',
  'The timing is on your side right now.',
  'Today rewards patience more than speed.',
  'Your intuition is sharper than usual. Trust what you feel.',
  'Protect your energy today. Not every door needs to be opened.',
  'Something you started is ready to move forward.',
  'The quiet hours hold the best luck today.',
  'A moment of stillness this morning can shift the whole day.',
  'Let one thing go. The space it creates is lucky.',
  'Your luck is gentle today — work with it, not against it.',
  'The best timing comes from being ready, not from rushing.',
  'Your focus is your best luck today. One thing at a time.',
  'A small kind act today comes back to you doubled.',
  'The details you usually skip are worth checking today.',
  'Today favors people who ask for exactly what they want.',
  'Move forward without needing everything to be perfect first.',
  'Rest when the moment allows. Even luck needs rest.',
  'Something that felt stuck is ready to move.',
  'Your presence in a room is your strongest asset today.',
  'Do one thing today that feels like a treat, not a task.',
  'Less is more today — one good choice beats five rushed ones.',
  'A conversation today could change the shape of your week.',
  'Your energy is magnetic right now. Be choosy about where you spend it.',
  'What you protect today, you attract more of tomorrow.',
  'The lucky path today is the one that feels lighter.',
  'Old connections carry fresh energy right now.',
  "Your body knows what your mind hasn't decided yet. Listen.",
  'Today is a good day to receive, not just to give.',
  'Something around you is shifting in your favor, quietly.',
  'The most important thing today is how you begin it.',
  'Your luck lives in the small, deliberate choices.',
  'Speak your needs clearly — someone around you is ready to listen.',
  'A small action now opens a bigger door than you expect.',
  'This is a good day to say the thing you have been holding back.',
  // Moon-adjacent
  'The moon is reading your intentions today. Make them clear.',
  'What you do before noon today sets the tone for the week.',
  'Someone around you carries good news. Stay close to warmth.',
  'The energy around money and plans is clearer than usual today.',
  'Your lucky color is working quietly in the background.',
];

const moneyReadings = [
  'Save before you spend today. Future you will feel the difference.',
  'Check one small money detail you have been putting off.',
  'A careful plan today beats a risky move that costs more later.',
  'Good day to compare, research, and wait before committing.',
  'Keep receipts and avoid lending money — even to people you trust.',
  'Something small you do with money today builds toward something bigger.',
  'The best financial move today is the most boring one.',
  'Notice where your money is going before deciding where it should go.',
  'Avoid big purchases made from emotion rather than need.',
  'A small saving habit started today is worth more than a big plan started later.',
];

const loveReadings = [
  'Speak gently. A short kind message lands better than a long explanation.',
  'Do not reply when you are still feeling it. Wait, then respond.',
  'Listen more than you explain today. The other person needs to be heard.',
  'Small care matters more than big promises right now.',
  'Give the people you love a little more space than usual today.',
  'The relationship that needs your attention today is not the loudest one.',
  'Say the thing you mean, simply and without apology.',
  'A small act of care — a message, a snack, a remembering — goes far today.',
  'Avoid trying to fix what the other person simply wants you to witness.',
  'Today is a good day to love quietly rather than loudly.',
];

const workReadings = [
  'Finish one thing completely before opening the next.',
  'Today is good for planning, notes, and following up on loose ends.',
  'Ask one clear question instead of guessing. It saves more time.',
  'Avoid office noise today. Let your output speak instead.',
  'Your best progress today comes from one focused list, not ten open tabs.',
  'The task you keep avoiding is the one most worth doing first.',
  'A short clear message gets more done than a long uncertain one.',
  'Do the quiet work today. Not everything that matters makes noise.',
  'Trust the preparation you already did. Deliver without second-guessing.',
  'Good day to close, confirm, or complete — not to start something new.',
];

const healthReadings = [
  'Eat simple food and drink more water than usual today.',
  'Take a short walk when your mind starts to circle the same thought.',
  'Rest your eyes and protect the evening hours from heavy screens.',
  'Do not ignore the small signals your body is sending.',
  'Choose steady energy over pushing through what your body is asking to pause.',
  'Sleep is doing more for your luck than you realise right now.',
  'Eat your next meal without distraction. It counts more than it seems.',
  'Stretch, breathe, or step outside. A small reset changes the whole afternoon.',
  'The best thing for your health today is the one you have been skipping.',
  'Treat your body like it is already the version you want to become.',
];

const warnings = [
  'Speak less today. Watch how people act before you respond.',
  'Avoid arguing when the answer can wait until tomorrow.',
  'Do not rush money or love decisions today.',
  'Keep your phone down when something makes you feel irritated.',
  'A late plan may change. Stay flexible and hold plans lightly.',
  'Double-check times, names, and small details before sending.',
  'Avoid lending money or signing anything without reading it.',
  'The energy around contracts and agreements is sensitive today.',
  'Keep your plans to yourself for now. Share when they are ready.',
  'One wrong message sent fast can cost more than slow silence.',
  'If something feels off, it probably is. Trust that signal.',
  'Rest before making a big decision. Tired choices cost more.',
  'Be careful with words today — people are paying close attention.',
  'Avoid starting anything new until you finish what is already open.',
  'The people who take your energy quickly may take your luck too.',
  'Do not confuse busyness with progress today.',
  'Hold back the first reply that comes to mind. Think once more.',
  'Avoid places or people that leave you feeling drained.',
  'Big spending today may feel good now but regret later.',
  'Protect your plans — not everyone wishes you the best.',
];

const actions = [
  'Wear your lucky color today, even as a small detail.',
  'Write down one thing you want to call into your life.',
  'Light something — a candle, incense, or a lamp — and set your intention.',
  'Put something gold or red near where you work or rest today.',
  'Send one message to someone you have been meaning to reach.',
  'Clean or tidy the space near your front door.',
  'Eat something sweet this morning — honey, fruit, or something you love.',
  'Take a photo of something beautiful you notice today.',
  'Write your lucky number somewhere visible before you start your day.',
  'Say one kind thing about yourself out loud before noon.',
  'Finish the one thing on your list you keep moving to tomorrow.',
  'Drink a full glass of water before checking your phone.',
  'Spend five minutes outside, even just to stand in the open air.',
  'Close one unfinished thing before you open anything new.',
  'Let yourself receive a compliment today without deflecting it.',
  'Call or message one person who always makes you feel calm.',
  'Buy yourself one small thing you have been putting off.',
  'Write down three things that are going right, however small.',
  'Give one thing away — clear the space for something new.',
  'Set your phone face-down for one full hour.',
  'Notice the first beautiful thing you see today and take a breath.',
  'Make your space smell good — clean, fresh, or something you love.',
  'Let yourself rest for at least ten minutes without guilt.',
  'Text the person you have been thinking about but have not reached.',
  'Eat your next meal slowly and without your phone.',
  'Write down what you want your week to feel like.',
  'Do something with your hands — cook, arrange, clean, or create.',
  'Put one coin or bill aside today as a symbol of growing wealth.',
  'Say your lucky number three times quietly before a decision.',
  'Do one thing today that is only for you, not for anyone else.',
];

const luckyColors = ['Green', 'White', 'Gold', 'Blue', 'Red', 'Black', 'Pink', 'Yellow', 'Silver'];
const luckyDirections = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
const luckyTimes = ['7 AM - 9 AM', '9 AM - 11 AM', '11 AM - 1 PM', '1 PM - 3 PM', '3 PM - 5 PM', '6 PM - 8 PM'];
const goodForPool = ['work', 'planning', 'saving money', 'family calls', 'cleaning', 'study', 'short trips'];
const avoidPool = ['arguing', 'impulse spending', 'late replies', 'big promises', 'rushing', 'gossip', 'heavy food'];
const moonPhaseMessages: Record<string, string> = {
  'New Moon': 'A fresh cycle begins. Set one quiet intention and protect it.',
  'Waxing Crescent': 'The energy is building. One small step forward is enough.',
  'First Quarter': 'A moment of decision. Choose action over overthinking.',
  'Waxing Gibbous': 'Almost there. Refine and steady yourself before the peak.',
  'Full Moon': 'Energy is at its height. Notice what feels clear and let it guide you.',
  'Waning Gibbous': 'The peak has passed. Share what you learned and simplify your plans.',
  'Last Quarter': 'Time to release. Let go of one thing that costs more than it gives.',
  'Waning Crescent': 'The cycle closes gently. Rest, reset, and prepare to begin again.',
};

const chineseNewYearDates: Record<number, string> = {
  1924: '1924-02-05',
  1925: '1925-01-24',
  1926: '1926-02-13',
  1927: '1927-02-02',
  1928: '1928-01-23',
  1929: '1929-02-10',
  1930: '1930-01-30',
  1931: '1931-02-17',
  1932: '1932-02-06',
  1933: '1933-01-26',
  1934: '1934-02-14',
  1935: '1935-02-04',
  1936: '1936-01-24',
  1937: '1937-02-11',
  1938: '1938-01-31',
  1939: '1939-02-19',
  1940: '1940-02-08',
  1941: '1941-01-27',
  1942: '1942-02-15',
  1943: '1943-02-05',
  1944: '1944-01-25',
  1945: '1945-02-13',
  1946: '1946-02-02',
  1947: '1947-01-22',
  1948: '1948-02-10',
  1949: '1949-01-29',
  1950: '1950-02-17',
  1951: '1951-02-06',
  1952: '1952-01-27',
  1953: '1953-02-14',
  1954: '1954-02-04',
  1955: '1955-01-24',
  1956: '1956-02-12',
  1957: '1957-01-31',
  1958: '1958-02-18',
  1959: '1959-02-08',
  1960: '1960-01-28',
  1961: '1961-02-15',
  1962: '1962-02-05',
  1963: '1963-01-25',
  1964: '1964-02-13',
  1965: '1965-02-02',
  1966: '1966-01-21',
  1967: '1967-02-09',
  1968: '1968-01-30',
  1969: '1969-02-17',
  1970: '1970-02-06',
  1971: '1971-01-27',
  1972: '1972-02-15',
  1973: '1973-02-03',
  1974: '1974-01-23',
  1975: '1975-02-11',
  1976: '1976-01-31',
  1977: '1977-02-18',
  1978: '1978-02-07',
  1979: '1979-01-28',
  1980: '1980-02-16',
  1981: '1981-02-05',
  1982: '1982-01-25',
  1983: '1983-02-13',
  1984: '1984-02-02',
  1985: '1985-02-20',
  1986: '1986-02-09',
  1987: '1987-01-29',
  1988: '1988-02-17',
  1989: '1989-02-06',
  1990: '1990-01-27',
  1991: '1991-02-15',
  1992: '1992-02-04',
  1993: '1993-01-23',
  1994: '1994-02-10',
  1995: '1995-01-31',
  1996: '1996-02-19',
  1997: '1997-02-07',
  1998: '1998-01-28',
  1999: '1999-02-16',
  2000: '2000-02-05',
  2001: '2001-01-24',
  2002: '2002-02-12',
  2003: '2003-02-01',
  2004: '2004-01-22',
  2005: '2005-02-09',
  2006: '2006-01-29',
  2007: '2007-02-18',
  2008: '2008-02-07',
  2009: '2009-01-26',
  2010: '2010-02-14',
  2011: '2011-02-03',
  2012: '2012-01-23',
  2013: '2013-02-10',
  2014: '2014-01-31',
  2015: '2015-02-19',
  2016: '2016-02-08',
  2017: '2017-01-28',
  2018: '2018-02-16',
  2019: '2019-02-05',
  2020: '2020-01-25',
  2021: '2021-02-12',
  2022: '2022-02-01',
  2023: '2023-01-22',
  2024: '2024-02-10',
  2025: '2025-01-29',
  2026: '2026-02-17',
  2027: '2027-02-07',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-02',
  2031: '2031-01-23',
  2032: '2032-02-11',
  2033: '2033-01-31',
  2034: '2034-02-19',
  2035: '2035-02-08',
};

export function getChineseZodiac(birthday: string) {
  const date = new Date(`${birthday}T00:00:00`);
  const gregorianYear = date.getFullYear();
  const lunarNewYear = chineseNewYearDates[gregorianYear];
  const zodiacYear = lunarNewYear && birthday < lunarNewYear ? gregorianYear - 1 : gregorianYear;
  const index = ((zodiacYear - 1900) % 12 + 12) % 12;
  return chineseZodiacAnimals[index];
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
    mainFocus: normalizeMainFocuses(input.mainFocus),
    notificationTime: input.notificationTime?.trim(),
    westernZodiac: getWesternZodiac(birthday),
    chineseZodiac: getChineseZodiac(birthday),
    photos: input.photos,
    photoTimestamps: input.photoTimestamps,
    mediaConsentAt: input.mediaConsentAt ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function normalizeMainFocuses(value: Profile['mainFocus'] | MainFocus): MainFocus[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? value : ['Luck'];
  }

  return [value];
}

export function getDailySeed(profile: Pick<Profile, 'nickname' | 'birthday'>, date = new Date()) {
  return hashString(`${profile.nickname.toLowerCase()}|${profile.birthday}|${todayKey(date)}`);
}

export function pickFromArrayWithSeed<T>(array: T[], seed: number, offset = 0) {
  return array[Math.abs(seed + offset * 9973) % array.length];
}

export function getMoonPhase(date = new Date()) {
  const lunarCycleDays = 29.530588853;
  const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14);
  const dateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12);
  const daysSinceKnownNewMoon = (dateUtc - knownNewMoonUtc) / 86400000;
  const cyclePosition = ((daysSinceKnownNewMoon % lunarCycleDays) + lunarCycleDays) % lunarCycleDays;
  const phaseIndex = Math.floor((cyclePosition / lunarCycleDays) * 8 + 0.5) % 8;

  return [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
  ][phaseIndex];
}

export function generateDailyReading(profile: Profile, date = new Date()): DailyReading {
  const seed = getDailySeed(profile, date);
  const day = date.getDay();
  const chineseZodiac = getChineseZodiac(profile.birthday);
  const zodiacBias = chineseZodiac.length + profile.westernZodiac.length;
  const mainFocuses = normalizeMainFocuses(profile.mainFocus);
  const primaryFocus = pickFromArrayWithSeed(mainFocuses, seed, 0);
  const focusGood = mainFocuses.flatMap((focus) => focusGoodFor[focus]);
  const focusAvoid = mainFocuses.flatMap((focus) => avoidByFocus[focus]);
  const score = 55 + (Math.abs(seed + day + zodiacBias + mainFocuses.length) % 38);
  const moonPhase = getMoonPhase(date);

  return {
    date: todayKey(date),
    score,
    mainMessage: pickFromArrayWithSeed(mainMessages, seed, day),
    goodFor: unique([
      primaryFocus.toLowerCase(),
      ...mainFocuses.map((focus) => focus.toLowerCase()),
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
    moonPhase,
    moonMessage: moonPhaseMessages[moonPhase],
    chineseZodiac,
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
