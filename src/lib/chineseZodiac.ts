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
  Rat: { emoji: '🐭', tone: 'Clever, quick, full of charm' },
  Ox: { emoji: '🐮', tone: 'Steady, patient, deeply grounded' },
  Tiger: { emoji: '🐯', tone: 'Brave, bold, radiant spirit' },
  Rabbit: { emoji: '🐰', tone: 'Gentle, graceful, softly luminous' },
  Dragon: { emoji: '🐲', tone: 'Magnetic, powerful, golden energy' },
  Snake: { emoji: '🐍', tone: 'Wise, intuitive, quietly powerful' },
  Horse: { emoji: '🐴', tone: 'Free-spirited, bright, always moving' },
  Goat: { emoji: '🐐', tone: 'Creative, kind, peacefully abundant' },
  Monkey: { emoji: '🐵', tone: 'Playful, sharp, perfectly timed' },
  Rooster: { emoji: '🐔', tone: 'Polished, clear, quietly confident' },
  Dog: { emoji: '🐶', tone: 'Loyal, protective, deeply honest' },
  Pig: { emoji: '🐷', tone: 'Warm, generous, abundantly open' },
};

export function getChineseZodiacDetails(animal: string) {
  return zodiacDetails[animal] ?? { emoji: '✨', tone: 'Personal luck energy' };
}
