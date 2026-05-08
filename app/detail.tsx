import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

async function triggerShareHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../src/components/Card';
import { EnergyScoreCard } from '../src/components/EnergyScoreCard';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getNextMilestoneTarget, getReadingStreak } from '../src/lib/streak';
import { getStoredProfile, getStoredReadingHistory, saveReadingHistoryItem } from '../src/lib/storage';
import { colors, fonts, radii, spacing } from '../src/styles/theme';
import { DailyReading, MainFocus } from '../src/types';

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
  const [mainFocuses, setMainFocuses] = useState<MainFocus[]>(['Luck']);
  const [streak, setStreak] = useState(0);
  const [nextMilestoneTarget, setNextMilestoneTarget] = useState<number | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
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
        setMainFocuses(profile.mainFocus?.length ? profile.mainFocus : ['Luck']);
        setShowAllInsights(false);
        const todayReading = generateDailyReading(profile);
        setReading(todayReading);
        const nextHistory = [todayReading, ...history.filter((item) => item.date !== todayReading.date)];
        const currentStreak = getReadingStreak(nextHistory);
        setStreak(currentStreak);
        setNextMilestoneTarget(getNextMilestoneTarget(currentStreak));
        saveReadingHistoryItem(todayReading).catch(() => undefined);

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

  const insightRows = getInsightRows(reading, mainFocuses);
  const visibleInsights = showAllInsights ? insightRows : insightRows.slice(0, 3);
  const hiddenInsightCount = Math.max(0, insightRows.length - 3);
  const actionSentence = getActionSentence(reading.action);

  return (
    <Screen showTabBar>
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.brandRow}>
        <Text style={styles.brandMark}>LuckyDay</Text>
        <Text style={styles.brandSub}>{formatReadingDate(reading)}</Text>
      </View>
      <Text style={styles.pageTitle}>{nickname ? `${nickname}'s luck today ✨` : "Today's Reading ✨"}</Text>

      {/* ── Energy score orb — the headline number ── */}
      <EnergyScoreCard score={reading.score} message={reading.mainMessage} />

      <View style={styles.streakRow}>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>{getStreakLabel(streak)}</Text>
        </View>
        {nextMilestoneTarget && streak > 0 ? (
          <Text style={styles.streakHint}>
            {nextMilestoneTarget - streak} days to your {nextMilestoneTarget}-day milestone
          </Text>
        ) : null}
      </View>

      {/* ── Action hero — the #1 thing to do today ── */}
      <Card style={styles.actionCard}>
        <Text style={styles.actionLabel}>🍀 Try this today</Text>
        <Text style={styles.actionText}>{actionSentence}</Text>
      </Card>

      {/* ── Best time — strong daily hook ── */}
      <Card style={styles.bestTimeCard}>
        <Text style={styles.bestTimeLabel}>⏰ Best time</Text>
        <Text style={styles.bestTimeValue}>{reading.luckyTime}</Text>
      </Card>

      {/* ── Good for / Avoid — immediate dashboard guidance ── */}
      {(reading.goodFor?.length > 0 || reading.avoid?.length > 0) ? (
        <View style={styles.almanacBlock}>
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
        </View>
      ) : null}

      {/* ── Score scale + influences — context for what the number means ── */}
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
        <View style={styles.divider} />
        <Text style={styles.influencesLabel}>What shaped today</Text>
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
      </View>

      {/* ── Lucky metrics at a glance ── */}
      <View style={styles.quickRow}>
        <View style={[styles.quickCard, styles.colorQuickCard, { flex: 3 }]}>
          <View style={[styles.colorSwatch, { backgroundColor: getLuckyColorHex(reading.luckyColor) }]} />
          <Text style={styles.quickLabel}>Lucky color</Text>
          <Text style={styles.quickValue}>{reading.luckyColor}</Text>
          <Text style={styles.colorMeaning}>{getLuckyColorMeaning(reading.luckyColor)}</Text>
        </View>
        <View style={{ flex: 2, gap: spacing.md }}>
          <View style={[styles.quickCard, styles.numberQuickCard, { flex: 1 }]}>
            <Text style={styles.quickLabel}>Lucky no.</Text>
            <Text style={styles.numberValue}>{reading.luckyNumber}</Text>
          </View>
          <View style={[styles.quickCard, styles.directionQuickCard, { flex: 1 }]}>
            <Text style={styles.quickLabel}>Direction</Text>
            <Text style={styles.quickValue}>{reading.luckyDirection}</Text>
          </View>
        </View>
      </View>

      {/* ── Full reading breakdown ── */}
      <Card style={styles.stack}>
        <Text style={styles.deepDiveTitle}>✨ Today's top insights</Text>
        {visibleInsights.map((item, index) => (
          <View key={item.label}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <SectionRow label={item.label} value={item.value} />
          </View>
        ))}
        {hiddenInsightCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showAllInsights ? 'Show fewer insights' : 'Show more insights'}
            onPress={() => setShowAllInsights((current) => !current)}
            style={({ pressed }) => [styles.showMoreButton, pressed && styles.showMoreButtonPressed]}
          >
            <Text style={styles.showMoreText}>
              {showAllInsights ? 'Show less' : `Show ${hiddenInsightCount} more`}
            </Text>
          </Pressable>
        ) : null}
      </Card>

      {/* ── Share CTA ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share today's reading"
        onPress={() => { triggerShareHaptic(); shareReading(reading); }}
        style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
      >
        <Ionicons name="share-outline" size={20} color={colors.mauve} />
        <Text style={styles.shareButtonText}>Share today's reading</Text>
      </Pressable>
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
  if (score >= 90) return 'Peak energy today — a day to act boldly and initiate.';
  if (score >= 82) return 'Peak flow today — strong momentum, move with confidence.';
  if (score >= 75) return 'Strong energy today — good day for forward motion.';
  if (score >= 65) return 'Good energy today — choose steady action over rushing.';
  if (score >= 56) return 'Steady energy today — stay consistent and protect your focus.';
  return 'Rest energy today — pace yourself and conserve attention.';
}

function getActionSentence(action: string): string {
  const sentence = action.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? action.trim();
  if (sentence.length <= 120) return sentence;
  return `${sentence.slice(0, 117).trim()}...`;
}

function getStreakLabel(streak: number): string {
  if (streak <= 1) return 'Day 1 ritual streak';
  return `${streak}-day ritual streak`;
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

type InsightRow = {
  label: string;
  value: string;
};

function getInsightRows(reading: DailyReading, focuses: MainFocus[]): InsightRow[] {
  const rows: InsightRow[] = [];
  const addRow = (label: string, value: string | undefined) => {
    if (!value || rows.some((row) => row.label === label)) return;
    rows.push({ label, value });
  };

  addRow('🧿 Watch for', reading.warning);

  for (const focus of focuses) {
    if (focus === 'Money') addRow('💰 Money', reading.money);
    if (focus === 'Love') addRow('💗 Love', reading.love);
    if (focus === 'Work') addRow('📌 Work', reading.work);
    if (focus === 'Health') addRow('🌿 Health', reading.health);
    if (focus === 'Luck') addRow(`${getZodiacEmoji(reading.chineseZodiac)} ${reading.chineseZodiac}`, reading.zodiacInsight);
  }

  addRow(`${getZodiacEmoji(reading.chineseZodiac)} ${reading.chineseZodiac}`, reading.zodiacInsight);
  addRow(`⭐ ${reading.westernZodiac}`, reading.westernZodiacInsight);
  addRow(`🌙 ${reading.moonPhase}`, reading.moonMessage);
  addRow('💰 Money', reading.money);
  addRow('💗 Love', reading.love);
  addRow('📌 Work', reading.work);
  addRow('🌿 Health', reading.health);

  return rows;
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

function formatReadingDate(reading: DailyReading): string {
  const date = new Date(`${reading.date}T00:00:00`);
  const displayDate = Number.isNaN(date.getTime())
    ? reading.date
    : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const solarTermName = reading.solarTerm?.split(' · ')[0];

  return [displayDate, reading.lunarDate, solarTermName].filter(Boolean).join(' · ');
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
    fontSize: 22,
    fontWeight: '900',
    paddingTop: spacing.sm,
  },
  brandRow: {
    gap: 6,
    paddingTop: spacing.xs,
  },
  brandMark: {
    color: colors.mauve,
    fontFamily: fonts.heavy,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandSub: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  streakRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  streakPill: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  streakText: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  streakHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  lunarDate: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  almanacBlock: {
    gap: spacing.sm,
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
    opacity: 0.6,
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
    fontFamily: fonts.regular,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
  },
  bestTimeCard: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderWidth: 2,
    gap: spacing.xs,
  },
  bestTimeLabel: {
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bestTimeValue: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
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
  colorQuickCard: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  colorSwatch: {
    borderColor: colors.ink,
    borderRadius: radii.pill,
    borderWidth: 3,
    height: 44,
    width: 44,
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
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
  deepDiveTitle: {
    color: colors.mauve,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  influencesLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  showMoreButton: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  showMoreButtonPressed: {
    backgroundColor: colors.champagne,
  },
  showMoreText: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '900',
  },
  // Direction quick card
  directionQuickCard: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'column',
    gap: 4,
    justifyContent: 'center',
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  shareButtonPressed: {
    opacity: 0.78,
  },
  shareButtonText: {
    color: colors.mauve,
    fontSize: 16,
    fontWeight: '900',
  },
});
