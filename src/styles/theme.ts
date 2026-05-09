export const colors = {
  // Backgrounds
  background: '#FDF0F6',    // Warm petal blush
  backgroundDeep: '#F7E0EF', // Slightly richer for layering
  panel: '#FFFFFF',         // Clean white
  panelStrong: '#FBE8F3',   // Visible rose tint (was #FFF0F7)
  // Text
  ink: '#2D1635',           // Deep plum
  muted: '#8A5A76',         // Richer dusty rose (was #9B6B88)
  faint: '#A87B97',         // Bumped for WCAG ≥3:1 on petal blush bg (was #CDA0BB)
  // Lines
  line: '#E2C5D6',          // More readable (was #EDD8E8)
  // Semantic
  green: '#3A8C6E',
  red: '#D14870',
  gold: '#D6A84A',
  goldDeep: '#9A6410',      // Richer amber (was #A87418)
  blue: '#6E9FD3',
  jade: '#2F9A78',
  // Brand palette
  pink: '#FFD6EC',          // Soft pink
  blush: '#FFE4F0',         // Ultra-soft blush
  champagne: '#FFF0C7',     // Warm cream
  mauve: '#C03A78',         // KEY: vibrant rose-magenta (was #A8467C)
  roseGold: '#D690B0',      // Deeper, more visible (was #E8A8C0)
  luckyRed: '#D14870',
  luckyGold: '#EDBA40',     // Brighter, more luminous (was #D6A84A)
  lavender: '#EDE8FF',      // Soft mystical purple — time card accent
  sunrise: '#FFF3D8',       // Warm cream card bg
  white: '#FFFFFF',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 34,
  xl2: 48,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

/**
 * Custom font family names. The app no longer blocks launch on font loading;
 * iOS falls back to the system font if these variants are not available yet.
 */
export const fonts = {
  regular: 'Nunito-Regular',
  bold: 'Nunito-Bold',
  heavy: 'Nunito-Black',
};
