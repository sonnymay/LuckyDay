import { Platform, StyleSheet, Text, View } from 'react-native';
import { formatAuspiciousBadgeLabel, getAuspiciousDay } from '../lib/auspiciousDay';
import { elementEmoji, getChineseZodiacDetails, getZodiacElement } from '../lib/chineseZodiac';
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
  const element = getZodiacElement(reading.chineseZodiac);
  const emoji = element ? elementEmoji[element] : null;
  const auspiciousLabel = formatAuspiciousBadgeLabel(getAuspiciousDay(new Date(`${reading.date}T12:00:00`)));

  return (
    <View style={styles.card}>
      {/* Outer gold-on-mauve ring — almanac scroll framing */}
      <View style={styles.innerRing} pointerEvents="none" />
      {/* Decorative depth circles */}
      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={styles.decorCircle2} pointerEvents="none" />
      <Text style={styles.sparkleOne}>✦</Text>
      <Text style={styles.sparkleTwo}>✧</Text>
      <Text style={styles.flowerOne}>✿</Text>
      <Text style={styles.flowerTwo}>❀</Text>

      {/* Solar-term banner — only renders on the 24 节气 days */}
      {reading.solarTerm ? (
        <View style={styles.solarBanner}>
          <Text style={styles.solarBannerText}>✦ {reading.solarTerm} ✦</Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <Text style={styles.decor}>✿ ✦</Text>
        <View style={styles.dateBlock}>
          <Text style={styles.date}>✨ {formatShareDate(reading.date)}</Text>
          {reading.lunarDate ? <Text style={styles.lunarLine}>{reading.lunarDate}</Text> : null}
          <Text style={styles.dateSub}>From the Chinese Almanac</Text>
        </View>
        <Text style={styles.decor}>✧ ❀</Text>
      </View>

      {/* Auspicious-day ribbon — only when today qualifies as one of the 6 黄道日 */}
      {auspiciousLabel ? (
        <Text style={styles.auspiciousRibbon}>🌟 {auspiciousLabel}</Text>
      ) : (
        <Text style={styles.ritualBadge}>A little luck for today</Text>
      )}

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
          <Text style={styles.zodiacLabel}>
            {reading.westernZodiac ? 'East & West zodiac' : 'Chinese zodiac'}
          </Text>
          <Text style={styles.zodiacAnimal}>
            {reading.westernZodiac ? `${reading.chineseZodiac} · ${reading.westernZodiac}` : reading.chineseZodiac}
          </Text>
          {reading.zodiacInsight ? (
            <Text style={styles.zodiacInsight}>{reading.zodiacInsight}</Text>
          ) : null}
          {element ? (
            <Text style={styles.elementBadge}>{emoji} {element} Element</Text>
          ) : null}
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
        <Text style={styles.wordmarkSub}>The Chinese Almanac, daily</Text>
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
    borderColor: colors.luckyGold,
    borderRadius: 24,
    borderWidth: 5,
    height: 640,
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: 42,
    width: 360,
    ...Platform.select({
      web: { backgroundImage: `linear-gradient(160deg, ${colors.mauve} 0%, #76244A 100%)` }
    }),
  },
  innerRing: {
    borderColor: 'rgba(255, 240, 199, 0.45)',
    borderRadius: 16,
    borderWidth: 1,
    bottom: 12,
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  solarBanner: {
    alignSelf: 'center',
    backgroundColor: colors.luckyGold,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  solarBannerText: {
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lunarLine: {
    color: 'rgba(255, 240, 199, 0.78)',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '700',
    marginTop: 2,
  },
  auspiciousRibbon: {
    backgroundColor: colors.luckyGold,
    borderColor: colors.champagne,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
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
  sparkleOne: {
    color: 'rgba(255, 240, 199, 0.58)',
    fontSize: 22,
    fontWeight: '900',
    left: 42,
    position: 'absolute',
    top: 118,
  },
  sparkleTwo: {
    color: 'rgba(255, 228, 240, 0.72)',
    fontSize: 18,
    fontWeight: '900',
    position: 'absolute',
    right: 52,
    top: 188,
  },
  flowerOne: {
    color: 'rgba(255, 240, 199, 0.42)',
    fontSize: 24,
    left: 38,
    position: 'absolute',
    top: 478,
  },
  flowerTwo: {
    color: 'rgba(255, 228, 240, 0.5)',
    fontSize: 22,
    position: 'absolute',
    right: 44,
    top: 456,
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
  dateSub: {
    color: colors.blush,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },
  ritualBadge: {
    backgroundColor: 'rgba(255, 240, 199, 0.18)',
    borderColor: 'rgba(255, 240, 199, 0.36)',
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
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
  zodiacInsight: {
    color: colors.blush,
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 2,
  },
  elementBadge: {
    color: colors.luckyGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 3,
    textTransform: 'uppercase',
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
