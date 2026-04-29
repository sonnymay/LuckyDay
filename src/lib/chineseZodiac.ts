export const chineseZodiacAnimals = [
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

const zodiacDetails: Record<string, { emoji: string; tone: string }> = {
  Rat: { emoji: '🐭', tone: 'Clever, quick, charming luck' },
  Ox: { emoji: '🐮', tone: 'Steady, patient, grounded luck' },
  Tiger: { emoji: '🐯', tone: 'Brave, bold, radiant luck' },
  Rabbit: { emoji: '🐰', tone: 'Gentle, graceful, soft luck' },
  Dragon: { emoji: '🐲', tone: 'Magnetic, powerful, golden luck' },
  Snake: { emoji: '🐍', tone: 'Wise, intuitive, quiet luck' },
  Horse: { emoji: '🐴', tone: 'Free, bright, moving luck' },
  Goat: { emoji: '🐐', tone: 'Creative, kind, peaceful luck' },
  Monkey: { emoji: '🐵', tone: 'Playful, smart, lucky timing' },
  Rooster: { emoji: '🐔', tone: 'Polished, clear, confident luck' },
  Dog: { emoji: '🐶', tone: 'Loyal, protective, honest luck' },
  Pig: { emoji: '🐷', tone: 'Abundant, warm, generous luck' },
};

export function getChineseZodiacDetails(animal: string) {
  return zodiacDetails[animal] ?? { emoji: '✨', tone: 'Personal luck energy' };
}
