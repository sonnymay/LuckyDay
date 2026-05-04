const luckyColorHex: Record<string, string> = {
  Black: '#2A1712',
  Blue: '#7FB4E8',
  Cream: '#F5EDD6',
  Gold: '#F5B83E',
  Green: '#65B88A',
  Orange: '#F2A45D',
  Pink: '#F4A8BE',
  Purple: '#8E64B8',
  Red: '#D94A55',
  Silver: '#C8C7D0',
  White: '#FFFFFF',
  Yellow: '#F7D96B',
};

const luckyColorMeaning: Record<string, string> = {
  Black: 'Protection, focus, quiet power',
  Blue: 'Calm, clarity, trust',
  Cream: 'Warmth, comfort, gentle luck',
  Gold: 'Abundance, timing, confidence',
  Green: 'Growth, healing, steady luck',
  Orange: 'Wisdom, support, bright luck',
  Pink: 'Love, softness, attraction',
  Purple: 'Protection, intuition, quiet power',
  Red: 'Energy, courage, momentum',
  Silver: 'Intuition, grace, reflection',
  White: 'Clean starts, peace, protection',
  Yellow: 'Joy, optimism, bright luck',
};

export function getLuckyColorHex(color: string) {
  return luckyColorHex[color] ?? '#F5B83E';
}

export function getLuckyColorMeaning(color: string) {
  return luckyColorMeaning[color] ?? 'Clarity, timing, good luck';
}
