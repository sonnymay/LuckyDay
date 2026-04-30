import { Platform, StyleSheet, Text, View } from 'react-native';
import { getChineseZodiacDetails } from '../lib/chineseZodiac';
import { getLuckyColorHex, getLuckyColorMeaning } from '../lib/luckyColor';
import { colors, radii, spacing } from '../styles/theme';
import { DailyReading } from '../types';

type Props = {
  reading: DailyReading;
};

const haloSegments = 28;
const haloRadius = 78;
const haloDotSize = 9;

export function LuckyShareCard({ reading }: Props) {
  const filledSegments = Math.round((Math.max(0, Math.min(reading.score, 100)) / 100) * haloSegments);
  const zodiac = getChineseZodiacDetails(reading.chineseZodiac);
  const luckyColor = getLuckyColorHex(reading.luckyColor);

  return (
    <View style={styles.card}>
      {/* Decorative depth circles */}
      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={styles.decorCircle2} pointerEvents="none" />
      <View style={styles.topRow}>
        <Text style={styles.decor}>☾ ✦</Text>
        <View style={styles.dateBlock}>
          <Text style={styles.date}>✨ {formatShareDate(reading.date)}</Text>
          <Text style={styles.moon}>{reading.moonPhase}</Text>
        </View>
        <Text style={styles.decor}>✧ ☽</Text>
      </View>

      <View style={styles.orb}>
        {Array.from({ length: haloSegments }).map((_, index) => {
          const angle = (index / haloSegments) * Math.PI * 2 - Math.PI / 2;
          const isFilled = index < filledSegments;

          return (
            <View
              key={index}
              style={[
                styles.haloDot,
                {
                  backgroundColor: isFilled ? colors.luckyGold : colors.blush,
                  left: haloRadius + Math.cos(angle) * 68 - haloDotSize / 2,
                  opacity: isFilled ? 1 : 0.14,
                  top: haloRadius + Math.sin(angle) * 68 - haloDotSize / 2,
                },
              ]}
            />
          );
        })}
        <View style={styles.orbInner}>
          <Text style={styles.score}>{reading.score}</Text>
          <Text style={styles.scoreUnit}>luck energy</Text>
        </View>
      </View>

      <Text style={styles.message}>{reading.mainMessage}</Text>

      <View style={styles.zodiacPill}>
        <Text style={styles.zodiacEmoji}>{zodiac.emoji}</Text>
        <View style={styles.zodiacCopy}>
          <Text style={styles.zodiacLabel}>Chinese zodiac</Text>
          <Text style={styles.zodiacAnimal}>{reading.chineseZodiac}</Text>
        </View>
      </View>

      <View style={styles.miniRow}>
        <View style={styles.colorBlock}>
          <View style={[styles.swatch, { backgroundColor: luckyColor }]} />
          <View style={styles.colorText}>
            <Text style={styles.colorName}>{reading.luckyColor}</Text>
            <Text style={styles.colorMeaning}>{getLuckyColorMeaning(reading.luckyColor)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.numberBlock}>
          <Text style={styles.luckyNumber}>{reading.luckyNumber}</Text>
          <Text style={styles.numberLabel}>Lucky Number</Text>
        </View>
      </View>

      <View style={styles.brandBlock}>
        <Text style={styles.wordmark}>LuckyDay</Text>
        <Text style={styles.wordmarkSub}>daily luck ritual</Text>
      </View>
    </View>
  );
}

function formatShareDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    height: 640,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: 42,
    width: 360,
  },
  decorCircle1: {
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 999,
    height: 260,
    position: 'absolute',
    right: -70,
    top: -70,
    width: 260,
  },
  decorCircle2: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 999,
    bottom: -50,
    height: 180,
    left: -50,
    position: 'absolute',
    width: 180,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  decor: {
    color: colors.roseGold,
    fontSize: 24,
    fontWeight: '900',
  },
  date: {
    color: colors.champagne,
    fontSize: 15,
    fontWeight: '900',
  },
  dateBlock: {
    alignItems: 'center',
  },
  moon: {
    color: colors.blush,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },
  orb: {
    alignItems: 'center',
    backgroundColor: colors.blush,
    borderColor: colors.luckyGold,
    borderRadius: haloRadius,
    borderWidth: 2,
    height: 156,
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: `0 0 18px rgba(214, 168, 74, 0.45)`,
      },
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
      },
    }),
    width: 156,
  },
  haloDot: {
    borderRadius: haloDotSize / 2,
    height: haloDotSize,
    position: 'absolute',
    width: haloDotSize,
  },
  orbInner: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderRadius: radii.pill,
    height: 118,
    justifyContent: 'center',
    width: 118,
  },
  score: {
    color: colors.goldDeep,
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 58,
  },
  scoreUnit: {
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  message: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 33,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  zodiacPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 240, 199, 0.16)',
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  zodiacEmoji: {
    fontSize: 34,
    lineHeight: 38,
  },
  zodiacCopy: {
    alignItems: 'flex-start',
  },
  zodiacLabel: {
    color: colors.blush,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  zodiacAnimal: {
    color: colors.champagne,
    fontSize: 17,
    fontWeight: '900',
  },
  miniRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 240, 199, 0.14)',
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 96,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  colorBlock: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  swatch: {
    borderColor: colors.luckyGold,
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    width: 44,
  },
  colorText: {
    flex: 1,
  },
  colorName: {
    color: colors.champagne,
    fontSize: 18,
    fontWeight: '900',
  },
  colorMeaning: {
    color: colors.blush,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  divider: {
    backgroundColor: colors.roseGold,
    height: 58,
    marginHorizontal: spacing.sm,
    opacity: 0.6,
    width: 1,
  },
  numberBlock: {
    alignItems: 'center',
    width: 92,
  },
  luckyNumber: {
    color: colors.luckyGold,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 50,
  },
  numberLabel: {
    color: colors.blush,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  wordmark: {
    color: colors.champagne,
    fontSize: 25,
    fontWeight: '900',
  },
  brandBlock: {
    alignItems: 'center',
  },
  wordmarkSub: {
    color: colors.blush,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
