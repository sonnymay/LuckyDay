import { Profile } from '../src/types';
import {
  generateDailyReading,
  getChineseZodiac,
  getWesternZodiac,
} from '../src/lib/luck';

const emptyPhotos = {
  faceUri: '',
  leftPalmUri: '',
  rightPalmUri: '',
  handwritingUri: '',
};

const profiles: Array<Pick<Profile, 'nickname' | 'birthday' | 'mainFocus'>> = [
  { nickname: 'Maya', birthday: '1990-04-18', mainFocus: ['Work', 'Money'] },
  { nickname: 'Noah', birthday: '1988-11-03', mainFocus: ['Love'] },
  { nickname: 'Ari', birthday: '1995-02-14', mainFocus: ['Health', 'Luck'] },
  { nickname: 'Lina', birthday: '1979-08-26', mainFocus: ['Money'] },
  { nickname: 'Theo', birthday: '2001-01-21', mainFocus: ['Work'] },
  { nickname: 'Iris', birthday: '1993-06-09', mainFocus: ['Love', 'Luck'] },
  { nickname: 'Sam', birthday: '1984-12-30', mainFocus: ['Health'] },
  { nickname: 'June', birthday: '1998-09-23', mainFocus: ['Money', 'Work'] },
  { nickname: 'Kai', birthday: '1976-05-05', mainFocus: ['Luck'] },
  { nickname: 'Rae', birthday: '2004-10-31', mainFocus: ['Love', 'Health'] },
];

const auditDate = new Date('2026-05-14T12:00:00');

function buildProfile(input: Pick<Profile, 'nickname' | 'birthday' | 'mainFocus'>): Profile {
  return {
    id: input.nickname.toLowerCase(),
    nickname: input.nickname,
    birthday: input.birthday,
    mainFocus: input.mainFocus,
    westernZodiac: getWesternZodiac(input.birthday),
    chineseZodiac: getChineseZodiac(input.birthday),
    photos: emptyPhotos,
    mediaConsentAt: '2026-05-14T12:00:00.000Z',
    createdAt: '2026-05-14T12:00:00.000Z',
  };
}

for (const profileInput of profiles) {
  const profile = buildProfile(profileInput);
  const reading = generateDailyReading(profile, auditDate);

  console.log(`\n=== ${profile.nickname} | ${profile.birthday} | ${profile.chineseZodiac} | ${profile.westernZodiac} | ${profile.mainFocus.join(', ')} ===`);
  console.log(`date: ${reading.date}`);
  console.log(`mainMessage: ${reading.mainMessage}`);
  console.log(`goodFor: ${reading.goodFor.join(' · ')}`);
  console.log(`avoid: ${reading.avoid.join(' · ')}`);
  console.log(`lunarDate: ${reading.lunarDate}`);
  if (reading.solarTerm) console.log(`solarTerm: ${reading.solarTerm}`);
  console.log(`luckyColor: ${reading.luckyColor}`);
  console.log(`luckyTime: ${reading.luckyTime}`);
  console.log(`luckyDirection: ${reading.luckyDirection}`);
  console.log(`moonPhase: ${reading.moonPhase}`);
  console.log(`moonMessage: ${reading.moonMessage}`);
  console.log(`chineseZodiac: ${reading.chineseZodiac}`);
  console.log(`zodiacElement: ${reading.zodiacElement}`);
  console.log(`westernZodiac: ${reading.westernZodiac}`);
  console.log(`zodiacInsight: ${reading.zodiacInsight}`);
  console.log(`westernZodiacInsight: ${reading.westernZodiacInsight}`);
  console.log(`money: ${reading.money}`);
  console.log(`love: ${reading.love}`);
  console.log(`work: ${reading.work}`);
  console.log(`health: ${reading.health}`);
  console.log(`warning: ${reading.warning}`);
  console.log(`action: ${reading.action}`);
  console.log(`scoreReason: ${reading.scoreReason}`);
}
