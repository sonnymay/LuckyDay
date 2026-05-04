import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../src/components/Card';
import { PremiumGate } from '../src/components/PremiumGate';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { getMonthActivity, getNextMilestoneTarget, getReadingStreak, getStreakMilestone, MonthActivityDay } from '../src/lib/streak';
import { getPremiumStatus } from '../src/lib/purchases';
import { getStoredProfile, getStoredReadingHistory } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { DailyReading } from '../src/types';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

function HistorySkeleton() {
  return (
    <View style={styles.skeletonScreen}>
      <SkeletonBlock width="100%" height={110} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={80} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={220} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={160} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={160} style={{ borderRadius: 20 }} />
    </View>
  );
}

// ─── Stats helpers ─────────────────────────────────────────────────────────────

function computeStats(history: DailyReading[]) {
  const total = history.length;
  if (total === 0) return { total: 0, avgScore: 0, mostCommonColor: '—' };

  const avgScore = Math.round(history.reduce((sum, r) => sum + r.score, 0) / total);

  const colorCounts: Record<string, number> = {};
  for (const r of history) {
    if (r.luckyColor) colorCounts[r.luckyColor] = (colorCounts[r.luckyColor] || 0) + 1;
  }
  const mostCommonColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return { total, avgScore, mostCommonColor };
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [history, setHistory] = useState<DailyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([getStoredProfile(), getPremiumStatus()])
        .then(([profile, premiumStatus]) => {
          if (!active) return;

          if (!profile) {
            router.replace('/');
            return;
          }

          setIsPremium(premiumStatus.isPremium);
          return getStoredReadingHistory();
        })
        .then((items) => {
          if (active && items) setHistory(items);
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => { active = false; };
    }, []),
  );

  if (loading) return <HistorySkeleton />;

  const streak = getReadingStreak(history);
  const milestone = getStreakMilestone(streak);
  const stats = computeStats(history);
  const nextMilestoneTarget = getNextMilestoneTarget(streak);

  // Free users preview last 3 readings; premium users see all
  const FREE_LIMIT = 3;
  const previewHistory = isPremium ? history : history.slice(0, FREE_LIMIT);

  return (
    <Screen>
      {/* ── Header ── */}
      <Card style={styles.header}>
        <Text style={styles.title}>Reading history ✨</Text>
        <Text style={styles.copy}>Your recent LuckyDay readings stay on this device.</Text>
        <View style={styles.streakRow}>
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>
              {streak === 0 ? 'Start your streak today' : `${streak} ${streak === 1 ? 'day' : 'days'} streak 🔥`}
            </Text>
          </View>
          {nextMilestoneTarget && streak > 0 ? (
            <Text style={styles.milestoneHint}>
              {nextMilestoneTarget - streak} days to {nextMilestoneTarget}-day milestone
            </Text>
          ) : null}
        </View>
      </Card>

      {history.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyIllustrationEmoji}>🌙</Text>
            <Text style={styles.emptyIllustrationStar1}>✨</Text>
            <Text style={styles.emptyIllustrationStar2}>⭐</Text>
            <Text style={styles.emptyIllustrationStar3}>✨</Text>
          </View>
          <Text style={styles.emptyTitle}>Your first reading awaits</Text>
          <Text style={styles.emptyBody}>
            Open your daily reading to start building your luck archive. Come back every day to grow your streak and unlock history insights.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open today's reading"
            style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.emptyCtaLabel}>Open today's reading  →</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          {/* ── Stats summary ── */}
          <Card style={styles.statsCard}>
            <Text style={styles.statsHeading}>Your luck at a glance</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total readings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.avgScore}</Text>
                <Text style={styles.statLabel}>Avg. energy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, styles.statValueSmall]}>{stats.mostCommonColor}</Text>
                <Text style={styles.statLabel}>Top color</Text>
              </View>
            </View>
          </Card>

          {/* ── Month calendar ── */}
          <MonthActivityCard history={history} />

          {/* ── Reading list — gated for free users ── */}
          <PremiumGate isPremium={isPremium} featureLabel="full reading history">
            <View style={styles.historyList}>
              {previewHistory.map((reading) => (
                <HistoryCard key={reading.date} reading={reading} />
              ))}
            </View>
          </PremiumGate>
        </>
      )}
    </Screen>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MonthActivityCard({ history }: { history: DailyReading[] }) {
  const activity = getMonthActivity(history);

  return (
    <Card style={styles.monthCard}>
      <Text style={styles.monthTitle}>{formatMonthTitle()}</Text>
      <Text style={styles.monthCopy}>Gold marks the days you opened your luck ritual.</Text>
      <View style={styles.weekdayRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {Array.from({ length: getMonthStartOffset() }).map((_, index) => (
          <View key={`blank-${index}`} style={styles.dayCell} />
        ))}
        {activity.map((day) => <MonthDay key={day.date} day={day} />)}
      </View>
    </Card>
  );
}

function MonthDay({ day }: { day: MonthActivityDay }) {
  return (
    <View style={[styles.dayCell, day.hasReading && styles.activeDay, day.isToday && styles.todayCell]}>
      <Text style={[styles.dayText, day.hasReading && styles.activeDayText]}>{day.day}</Text>
    </View>
  );
}

function HistoryCard({ reading }: { reading: DailyReading }) {
  return (
    <Card style={styles.historyCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.date}>{formatHistoryDate(reading.date)}</Text>
          <Text style={styles.message}>{reading.mainMessage}</Text>
        </View>
        <View style={styles.scoreBubble}>
          <Text style={styles.score}>{reading.score}</Text>
          <Text style={styles.scoreLabel}>energy</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.miniMetricsRow}>
        <View style={styles.miniMetric}>
          <Text style={styles.miniMetricLabel}>🎨 Color</Text>
          <Text style={styles.miniMetricValue}>{reading.luckyColor}</Text>
        </View>
        <View style={styles.miniMetricDivider} />
        <View style={styles.miniMetric}>
          <Text style={styles.miniMetricLabel}>🔢 Number</Text>
          <Text style={styles.miniMetricValue}>{reading.luckyNumber}</Text>
        </View>
        {reading.moonPhase ? (
          <>
            <View style={styles.miniMetricDivider} />
            <View style={styles.miniMetric}>
              <Text style={styles.miniMetricLabel}>🌙 Moon</Text>
              <Text style={styles.miniMetricValue} numberOfLines={1}>{reading.moonPhase}</Text>
            </View>
          </>
        ) : null}
      </View>
      <View style={styles.divider} />
      <SectionRow label="🍀 Small action" value={reading.action ?? '—'} />
    </Card>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function formatHistoryDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMonthTitle(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getMonthStartOffset(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  skeletonScreen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  title: {
    color: colors.mauve,
    fontSize: 28,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  streakRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  streakPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  streakText: {
    color: colors.goldDeep,
    fontSize: 14,
    fontWeight: '900',
  },
  milestoneHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    paddingVertical: spacing.xl,
  },
  emptyIllustration: {
    alignItems: 'center',
    height: 90,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
    width: 120,
  },
  emptyIllustrationEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  emptyIllustrationStar1: {
    fontSize: 18,
    left: 0,
    lineHeight: 22,
    position: 'absolute',
    top: 4,
  },
  emptyIllustrationStar2: {
    fontSize: 14,
    lineHeight: 18,
    position: 'absolute',
    right: 0,
    top: 10,
  },
  emptyIllustrationStar3: {
    bottom: 0,
    fontSize: 16,
    lineHeight: 20,
    position: 'absolute',
    right: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyCta: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyCtaPressed: {
    opacity: 0.82,
  },
  emptyCtaLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  // Stats summary card
  statsCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
  },
  statsHeading: {
    color: colors.mauve,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: colors.mauve,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  statValueSmall: {
    fontSize: 20,
    lineHeight: 28,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statDivider: {
    backgroundColor: '#C8BFEE',
    height: 50,
    width: 1,
  },
  // Month activity card
  monthCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  monthTitle: {
    color: colors.mauve,
    fontSize: 22,
    fontWeight: '900',
  },
  monthCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  weekday: {
    color: colors.goldDeep,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexBasis: '12.3%',
    justifyContent: 'center',
  },
  activeDay: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
  },
  todayCell: {
    borderColor: colors.mauve,
    borderWidth: 2,
  },
  dayText: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: '800',
  },
  activeDayText: {
    color: colors.goldDeep,
    fontWeight: '900',
  },
  // History list
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  cardTopLeft: {
    flex: 1,
  },
  date: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  message: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: spacing.xs,
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 34,
    borderWidth: 2,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  score: {
    color: colors.goldDeep,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  scoreLabel: {
    color: colors.mauve,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  miniMetricsRow: {
    flexDirection: 'row',
    gap: 0,
  },
  miniMetric: {
    alignItems: 'center',
    flex: 1,
  },
  miniMetricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  miniMetricValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  miniMetricDivider: {
    backgroundColor: colors.line,
    width: 1,
    marginVertical: 4,
  },
});
