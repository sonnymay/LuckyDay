import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Share, StyleSheet, Text, View } from 'react-native';

async function triggerShareHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
import { router, useFocusEffect } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { EnergyScoreCard } from '../src/components/EnergyScoreCard';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getStoredProfile, getStoredReadingHistory } from '../src/lib/storage';
import { colors, fonts, radii, spacing } from '../src/styles/theme';
import { DailyReading } from '../src/types';

// ── Skeleton helpers (matches home.tsx pattern for consistency) ──────────────
function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 12, backgroundColor: colors.roseGold, opacity }, style]}
    />
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.skeletonScreen}>
      <SkeletonBlock width="100%" height={90} style={{ borderRadius: 20 }} />
      <View style={styles.quickRow}>
        <SkeletonBlock width="60%" height={80} style={{ borderRadius: 20 }} />
        <SkeletonBlock width="36%" height={80} style={{ borderRadius: 20 }} />
      </View>
      <View style={styles.quickRow}>
        <SkeletonBlock width="48%" height={70} style={{ borderRadius: 20 }} />
        <SkeletonBlock width="48%" height={70} style={{ borderRadius: 20 }} />
      </View>
      <SkeletonBlock width="100%" height={100} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={360} style={{ borderRadius: 20 }} />
    </View>
  );
}

export default function DetailScreen() {
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [yesterdayScore, setYesterdayScore] = useState<number | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fadeAnim.setValue(0);

      Promise.all([getStoredProfile(), getStoredReadingHistory()]).then(([profile, history]) => {
        if (!active) return;
        if (!profile) {
          router.replace('/');
          return;
        }
        setNickname(profile.nickname ?? '');
        const todayReading = generateDailyReading(profile);
        setReading(todayReading);

        // Find the most recent reading that isn't today
        const past = history.filter((h) => h.date !== todayReading.date);
        if (past.length > 0) {
          setYesterdayScore(past[0].score);
        } else {
          setYesterdayScore(null);
        }

        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });

      return () => { active = false; };
    }, []),
  );

  if (loading || !reading) {
    return <DetailSkeleton />;
  }

  return (
    <Screen showTabBar>
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={styles.pageTitle}>{nickname ? `${nickname}'s luck today ✨` : "Today's Reading ✨"}</Text>

      {/* ── Energy score orb — the headline number ── */}
      <EnergyScoreCard label="✨ Today's luck energy" score={reading.score} message={reading.mainMessage} />

      {/* ── Score scale + yesterday — context for what the number means ── */}
      <View style={styles.scoreContextCard}>
        <View style={styles.scoreScaleRow}>
          {SCORE_BANDS.map((band) => (
            <View
              key={band.label}
              style={[styles.scoreBand, { backgroundColor: band.color }, reading.score >= band.min && reading.score < band.max && styles.scoreBandActive]}
            >
              <Text style={[styles.scoreBandLabel, reading.score >= band.min && reading.score < band.max && styles.scoreBandLabelActive]}>
                {band.label}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.scoreContextLine}>{getScoreContext(reading.score)}</Text>
        {yesterdayScore !== null ? (
          <Text style={styles.yesterdayLine}>
            {getDeltaExplanation(reading.score, yesterdayScore, reading.moonPhase)}
          </Text>
        ) : null}
      </View>

      {/* ── Influence breakdown — what shaped today's reading ── */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownChip}>
          <Text style={styles.breakdownEmoji}>{getZodiacEmoji(reading.chineseZodiac)}</Text>
          <View>
            <Text style={styles.breakdownLabel}>{reading.chineseZodiac}</Text>
            <Text style={styles.breakdownValue}>{getBaseStrength(reading.scoreBase)}</Text>
          </View>
        </View>
        <View style={styles.breakdownChip}>
          <Text style={styles.breakdownEmoji}>{getMoonChipEmoji(reading.moonPhase)}</Text>
          <View>
            <Text style={styles.breakdownLabel}>{reading.moonPhase}</Text>
            <Text style={[styles.breakdownValue, reading.scoreMoonBonus === 0 && styles.breakdownNeutral]}>
              {reading.scoreMoonBonus >= 6 ? 'Peak lift' : reading.scoreMoonBonus >= 3 ? 'Clear lift' : reading.scoreMoonBonus > 0 ? 'Gentle lift' : 'Neutral'}
            </Text>
          </View>
        </View>
        <View style={styles.breakdownChip}>
          <Text style={styles.breakdownEmoji}>📖</Text>
          <View>
            <Text style={styles.breakdownLabel}>Almanac</Text>
            <Text style={[styles.breakdownValue, reading.scoreAlmanacBonus === 0 && styles.breakdownNeutral]}>
              {reading.scoreAlmanacBonus >= 4 ? 'Very auspicious' : reading.scoreAlmanacBonus >= 2 ? 'Favorable' : 'Quiet day'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Action hero — the #1 thing to do today ── */}
      <Card style={styles.actionCard}>
        <Text style={styles.actionLabel}>🍀 Do this today</Text>
        <Text style={styles.actionText}>{reading.action}</Text>
      </Card>

      {/* ── Date + main message ── */}
      <Card style={styles.top}>
        <View style={styles.dateRow}>
          <Text style={styles.date}>✨ {reading.date}</Text>
          {reading.lunarDate ? <Text style={styles.lunarDate}>🌙 {reading.lunarDate}</Text> : null}
        </View>
        {reading.solarTerm ? (
          <Text style={styles.solarTerm}>{reading.solarTerm}</Text>
        ) : null}
        <Text style={styles.title}>{reading.mainMessage}</Text>
      </Card>

      {/* ── Lucky metrics at a glance ── */}
      <View style={styles.quickRow}>
        <View style={[styles.quickCard, { flex: 3 }]}>
          <View style={[styles.colorSwatch, { backgroundColor: getLuckyColorHex(reading.luckyColor) }]} />
          <View style={styles.quickCopy}>
            <Text style={styles.quickLabel}>Lucky color</Text>
            <Text style={styles.quickValue}>{reading.luckyColor}</Text>
            <Text style={styles.colorMeaning}>{getLuckyColorMeaning(reading.luckyColor)}</Text>
          </View>
        </View>
        <View style={[styles.quickCard, styles.numberQuickCard, { flex: 2 }]}>
          <Text style={styles.quickLabel}>Lucky no.</Text>
          <Text style={styles.numberValue}>{reading.luckyNumber}</Text>
        </View>
      </View>
      <View style={styles.quickRow}>
        <View style={[styles.quickCard, styles.timeQuickCard, { flex: 1 }]}>
          <Text style={styles.quickLabel}>Best time</Text>
          <Text style={styles.quickValue}>{reading.luckyTime}</Text>
        </View>
        <View style={[styles.quickCard, styles.directionQuickCard, { flex: 1 }]}>
          <Text style={styles.quickLabel}>Direction</Text>
          <Text style={styles.quickValue}>{reading.luckyDirection}</Text>
        </View>
      </View>

      {/* ── Good for / Avoid ── */}
      {(reading.goodFor?.length > 0 || reading.avoid?.length > 0) ? (
        <View style={styles.pillsRow}>
          {reading.goodFor?.length > 0 ? (
            <View style={[styles.pillsGroup, styles.goodGroup]}>
              <Text style={styles.pillsLabel}>✅ Good for</Text>
              <View style={styles.pillsWrap}>
                {reading.goodFor.map((item) => (
                  <Text key={item} style={styles.goodPill}>{item}</Text>
                ))}
              </View>
            </View>
          ) : null}
          {reading.avoid?.length > 0 ? (
            <View style={[styles.pillsGroup, styles.avoidGroup]}>
              <Text style={styles.pillsLabel}>⚠️ Avoid</Text>
              <View style={styles.pillsWrap}>
                {reading.avoid.map((item) => (
                  <Text key={item} style={styles.avoidPill}>{item}</Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Full reading breakdown ── */}
      <Card style={styles.stack}>
        <View style={styles.zodiacRow}>
          <View style={styles.zodiacHalf}>
            <SectionRow label="🐲 Chinese zodiac" value={reading.chineseZodiac} />
          </View>
          <View style={styles.zodiacDivider} />
          <View style={styles.zodiacHalf}>
            <SectionRow label="⭐ Western zodiac" value={reading.westernZodiac} />
          </View>
        </View>
        {reading.zodiacInsight ? (
          <>
            <View style={styles.divider} />
            <SectionRow label={`🐲 ${reading.chineseZodiac} insight`} value={reading.zodiacInsight} />
          </>
        ) : null}
        {reading.westernZodiacInsight ? (
          <>
            <View style={styles.divider} />
            <SectionRow label={`⭐ ${reading.westernZodiac} insight`} value={reading.westernZodiacInsight} />
          </>
        ) : null}
        <View style={styles.divider} />
        <SectionRow label={`🌙 ${reading.moonPhase}`} value={reading.moonMessage ?? ''} />
        <View style={styles.divider} />
        <SectionRow label="💰 Money" value={reading.money} />
        <View style={styles.divider} />
        <SectionRow label="💗 Love" value={reading.love} />
        <View style={styles.divider} />
        <SectionRow label="📌 Work" value={reading.work} />
        <View style={styles.divider} />
        <SectionRow label="🌿 Health" value={reading.health} />
        <View style={styles.divider} />
        <SectionRow label="🧿 Warning" value={reading.warning} />
      </Card>

      {/* ── Share CTA ── */}
      <AppButton
        label="🔗 Share today's reading"
        variant="secondary"
        onPress={() => { triggerShareHaptic(); shareReading(reading); }}
      />
    </Animated.View>
    </Screen>
  );
}

const SCORE_BANDS = [
  { label: 'Rest', min: 0,  max: 56,  color: '#EDE9F8' },
  { label: 'Steady', min: 56, max: 65, color: '#E8F2FF' },
  { label: 'Good',   min: 65, max: 75, color: '#E8F8EE' },
  { label: 'Strong', min: 75, max: 85, color: '#FFF8E0' },
  { label: 'Peak',   min: 85, max: 101, color: '#FFF0E8' },
];

function getScoreContext(score: number): string {
  if (score >= 90) return `${score} is peak energy — a day to act boldly and initiate.`;
  if (score >= 82) return `${score} is golden flow — strong momentum, move with confidence.`;
  if (score >= 70) return `${score} is bright and favorable — good day for forward motion.`;
  if (score >= 60) return `${score} is steady and workable — stay consistent, avoid rushing.`;
  if (score >= 55) return `${score} is a protect-and-prepare day — consolidate, don't overreach.`;
  return `${score} is a rest-and-reset day — pace yourself, conserve energy.`;
}

function getBaseStrength(base: number): string {
  if (base >= 75) return 'Strong today';
  if (base >= 65) return 'Rising today';
  if (base >= 58) return 'Steady today';
  return 'Quiet today';
}

function getDeltaExplanation(today: number, yesterday: number, moonPhase: string): string {
  const delta = today - yesterday;
  const absDelta = Math.abs(delta);
  const direction = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  if (absDelta === 0) return '→ Same energy as yesterday.';
  if (delta > 0) {
    if (absDelta >= 10) return `${direction} Up ${absDelta} from yesterday — daily alignment shifted in your favor.`;
    return `${direction} Up ${absDelta} from yesterday — energy is building.`;
  }
  if (absDelta >= 10) return `${direction} Down ${absDelta} from yesterday — ${moonPhase} calls for a steadier pace today.`;
  return `${direction} Down ${absDelta} from yesterday — a quieter day, not a bad one.`;
}

function getZodiacEmoji(zodiac: string): string {
  const map: Record<string, string> = {
    Rat: '🐀', Ox: '🐂', Tiger: '🐯', Rabbit: '🐰', Dragon: '🐲', Snake: '🐍',
    Horse: '🐎', Goat: '🐐', Monkey: '🐵', Rooster: '🐓', Dog: '🐕', Pig: '🐷',
  };
  return map[zodiac] ?? '🐉';
}

function getMoonChipEmoji(moonPhase: string): string {
  const map: Record<string, string> = {
    'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
    'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
    'Last Quarter': '🌗', 'Waning Crescent': '🌘',
  };
  return map[moonPhase] ?? '🌙';
}

function shareReading(reading: DailyReading) {
  Share.share({
    message: [
      `My LuckyDay reading for ${reading.date} ✨`,
      `\n"${reading.mainMessage}"`,
      `\n🎨 ${reading.luckyColor}  ·  🔢 ${reading.luckyNumber}  ·  ⏰ ${reading.luckyTime}  ·  🧭 ${reading.luckyDirection}`,
      reading.moonPhase ? `🌙 ${reading.moonPhase}` : '',
      `\n🍀 ${reading.action}`,
    ]
      .filter(Boolean)
      .join('\n'),
    title: "Today's LuckyDay reading",
  });
}

const styles = StyleSheet.create({
  skeletonScreen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  pageTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    paddingTop: spacing.sm,
  },
  top: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '800',
  },
  lunarDate: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  solarTerm: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  scoreReason: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pillsGroup: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  goodGroup: {
    backgroundColor: '#EDF8F2',
    borderColor: '#A8D8BE',
  },
  avoidGroup: {
    backgroundColor: '#FFF3ED',
    borderColor: '#F5BFAA',
  },
  pillsLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  goodPill: {
    backgroundColor: '#C9EDD9',
    borderRadius: radii.pill,
    color: '#1A6B41',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  avoidPill: {
    backgroundColor: '#FFD9C5',
    borderRadius: radii.pill,
    color: '#8B3B1A',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  // Score context + scale
  scoreContextCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.md,
  },
  scoreScaleRow: {
    flexDirection: 'row',
    gap: 3,
    height: 28,
  },
  scoreBand: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    opacity: 0.45,
  },
  scoreBandActive: {
    opacity: 1,
    ...Platform.select({
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  scoreBandLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreBandLabelActive: {
    color: colors.ink,
  },
  scoreContextLine: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  yesterdayLine: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  // Influence breakdown row — qualitative, no raw numbers
  breakdownRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  breakdownChip: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.md,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    padding: spacing.sm,
  },
  breakdownEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  breakdownLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  breakdownValue: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    marginTop: 1,
  },
  breakdownNeutral: {
    color: colors.faint,
  },
  // Action hero card
  actionCard: {
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    gap: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      web: { backgroundImage: `linear-gradient(135deg, ${colors.mauve} 0%, #A84878 100%)` },
    }),
  },
  actionLabel: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actionText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
  },
  // Lucky color + number quick row
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 8px rgba(192, 58, 120, 0.06), 0 10px 28px rgba(192, 58, 120, 0.12)`,
      },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 26,
        elevation: 5,
      },
    }),
  },
  colorSwatch: {
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 44,
    width: 44,
  },
  quickCopy: {
    flex: 1,
  },
  quickLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  colorMeaning: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
  numberQuickCard: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  numberValue: {
    color: colors.goldDeep,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 50,
  },
  // Breakdown card
  stack: {
    gap: 0,
  },
  zodiacRow: {
    flexDirection: 'row',
    gap: 0,
  },
  zodiacHalf: {
    flex: 1,
  },
  zodiacDivider: {
    backgroundColor: colors.line,
    marginHorizontal: spacing.md,
    width: 1,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  // Time + direction quick cards
  timeQuickCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    flexDirection: 'column',
    gap: 4,
  },
  directionQuickCard: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'column',
    gap: 4,
  },
});
