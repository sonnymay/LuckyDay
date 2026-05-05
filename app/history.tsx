import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../src/components/Card';
import { PremiumGate } from '../src/components/PremiumGate';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { getMonthActivity, getNextMilestoneTarget, getReadingStreak, getStreakMilestone, MonthActivityDay } from '../src/lib/streak';
import { getPremiumStatus } from '../src/lib/purchases';
import { getStoredFeedback, getStoredProfile, getStoredReadingHistory } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { DailyReading, Feedback } from '../src/types';

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

function computeAccuracySummary(history: DailyReading[], feedback: Feedback[]) {
  const feedbackByDate = new Map(feedback.map((item) => [item.date, item]));
  const reflectedDays = history
    .slice(0, 7)
    .map((reading) => ({ reading, feedback: feedbackByDate.get(reading.date) }))
    .filter((item): item is { reading: DailyReading; feedback: Feedback } => Boolean(item.feedback));

  const goodDayCount = reflectedDays.filter((item) => (item.feedback.overallDay ?? ratingToDayScore(item.feedback.rating)) >= 4).length;
  const strongPeakGoodCount = reflectedDays.filter((item) => item.reading.score >= 75 && (item.feedback.overallDay ?? ratingToDayScore(item.feedback.rating)) >= 4).length;
  const predictionAnswered = reflectedDays.filter((item) => item.feedback.predictionMatch);
  const predictionMatched = predictionAnswered.filter((item) => item.feedback.predictionMatch === 'aboutRight').length;

  return {
    reflectedDays: reflectedDays.length,
    predictionDays: predictionAnswered.length,
    predictionMatched,
    matchLine: predictionAnswered.length > 0
      ? `Last 7 days: readings matched your reality ${predictionMatched}/${predictionAnswered.length} reflected days`
      : 'Reflect after readings to reveal your match pattern.',
    reasonTag: buildMatchTag(predictionAnswered[0]),
    strongPeakMatched: formatCount(strongPeakGoodCount, goodDayCount),
    bestTimeAccurate: formatBooleanCount(reflectedDays.map((item) => item.feedback.bestTimeAccurate)),
    warningRelevant: formatBooleanCount(reflectedDays.map((item) => item.feedback.warningRelevant)),
    actionHelpful: formatBooleanCount(reflectedDays.map((item) => item.feedback.actionHelpful)),
  };
}

function buildMatchTag(item: { reading: DailyReading; feedback: Feedback } | undefined) {
  if (!item?.feedback.predictionMatch) return null;

  const dayScore = item.feedback.overallDay ?? ratingToDayScore(item.feedback.rating);

  if (item.feedback.predictionMatch === 'aboutRight') {
    if (item.reading.score >= 75 && dayScore >= 4) return 'Match: Strong score + good day';
    if (item.reading.goodFor.length >= 2) return 'Match: Almanac favorable';
    return 'Match: Day felt close to the reading';
  }

  if (item.feedback.predictionMatch === 'better' && item.reading.score < 75 && dayScore >= 4) {
    return 'Mismatch: Softer score, but day felt good';
  }

  if (item.feedback.predictionMatch === 'worse' && item.reading.score >= 75) {
    return 'Mismatch: Strong score, but day felt harder';
  }

  return item.feedback.predictionMatch === 'better'
    ? 'Mismatch: Day felt better than predicted'
    : 'Mismatch: Day felt harder than predicted';
}

function formatBooleanCount(values: Array<boolean | undefined>) {
  const answered = values.filter((value): value is boolean => value !== undefined);
  return formatCount(answered.filter(Boolean).length, answered.length);
}

function formatCount(count: number, total: number) {
  return total > 0 ? `${count}/${total}` : '—';
}

function ratingToDayScore(value: Feedback['rating']) {
  if (value === 'Yes') return 5;
  if (value === 'Somewhat') return 3;
  return 2;
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [history, setHistory] = useState<DailyReading[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fadeAnim.setValue(0);

      Promise.all([getStoredProfile(), getPremiumStatus()])
        .then(([profile, premiumStatus]) => {
          if (!active) return;

          if (!profile) {
            router.replace('/');
            return;
          }

          setIsPremium(premiumStatus.isPremium);
          return Promise.all([getStoredReadingHistory(), getStoredFeedback()]);
        })
        .then((items) => {
          if (active && items) {
            setHistory(items[0]);
            setFeedback(items[1]);
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          }
        });

      return () => { active = false; };
    }, []),
  );

  if (loading) return <HistorySkeleton />;

  const streak = getReadingStreak(history);
  const milestone = getStreakMilestone(streak);
  const stats = computeStats(history);
  const accuracy = computeAccuracySummary(history, feedback);
  const nextMilestoneTarget = getNextMilestoneTarget(streak);

  // Free users preview last 3 readings; premium users see all
  const FREE_LIMIT = 3;
  const previewHistory = isPremium ? history : history.slice(0, FREE_LIMIT);

  return (
    <Screen showTabBar>
    <Animated.View style={{ opacity: fadeAnim }}>
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
          <Text style={styles.emptyTitle}>Your luck history starts tonight.</Text>
          <Text style={styles.emptyBody}>
            Check in after your day to compare prediction vs reality.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open today's reading"
            style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
            onPress={() => router.replace('/detail')}
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

          <AccuracySummaryCard summary={accuracy} />

          {/* ── Month calendar ── */}
          <MonthActivityCard history={history} />

          {/* ── Reading list — gated for free users ── */}
          <PremiumGate isPremium={isPremium} featureLabel="full reading history">
            <View style={styles.historyList}>
              {previewHistory.map((reading) => (
                <HistoryCard key={reading.date} reading={reading} feedback={feedback.find((item) => item.date === reading.date)} />
              ))}
            </View>
          </PremiumGate>
        </>
      )}
    </Animated.View>
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

function AccuracySummaryCard({ summary }: { summary: ReturnType<typeof computeAccuracySummary> }) {
  return (
    <Card style={styles.accuracyCard}>
      <View style={styles.accuracyHeader}>
        <View>
          <Text style={styles.accuracyTitle}>Prediction vs. reality</Text>
          <Text style={styles.accuracyCopy}>
            {summary.matchLine}
          </Text>
          {summary.reasonTag ? <Text style={styles.reasonTag}>{summary.reasonTag}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reflect on today"
          onPress={() => router.push('/feedback')}
          style={({ pressed }) => [styles.reflectMiniButton, pressed && styles.reflectMiniButtonPressed]}
        >
          <Text style={styles.reflectMiniButtonText}>Reflect</Text>
        </Pressable>
      </View>
      <View style={styles.accuracyRows}>
        <AccuracyRow label="Reading felt about right" value={formatCount(summary.predictionMatched, summary.predictionDays)} />
        <AccuracyRow label="Strong/Peak matched good days" value={summary.strongPeakMatched} />
        <AccuracyRow label="Best time felt accurate" value={summary.bestTimeAccurate} />
        <AccuracyRow label="Warning felt useful" value={summary.warningRelevant} />
        <AccuracyRow label="Do This Today helped" value={summary.actionHelpful} />
      </View>
    </Card>
  );
}

function AccuracyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.accuracyRow}>
      <Text style={styles.accuracyRowLabel}>{label}</Text>
      <Text style={styles.accuracyRowValue}>{value}</Text>
    </View>
  );
}

function HistoryCard({ reading, feedback }: { reading: DailyReading; feedback?: Feedback }) {
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
      {feedback?.overallDay ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.reflectionSaved}>Journaled: {feedback.overallDay}/5 day{feedback.note ? ` · ${feedback.note}` : ''}</Text>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Reflect on ${formatHistoryDate(reading.date)}`}
        onPress={() => router.push(`/feedback?date=${reading.date}` as any)}
        style={({ pressed }) => [styles.reflectButton, pressed && styles.reflectButtonPressed]}
      >
        <Text style={styles.reflectButtonText}>{feedback ? 'Update reflection' : 'Reflect on this day'}</Text>
      </Pressable>
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
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
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
  accuracyCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  accuracyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  accuracyTitle: {
    color: colors.mauve,
    fontSize: 18,
    fontWeight: '900',
  },
  accuracyCopy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2,
  },
  reasonTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  reflectMiniButton: {
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reflectMiniButtonPressed: {
    opacity: 0.82,
  },
  reflectMiniButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  accuracyRows: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  accuracyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  accuracyRowLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  accuracyRowValue: {
    color: colors.mauve,
    fontSize: 18,
    fontWeight: '900',
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
    backgroundColor: 'rgba(192, 58, 120, 0.10)',
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
  reflectionSaved: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  reflectButton: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reflectButtonPressed: {
    backgroundColor: colors.champagne,
  },
  reflectButtonText: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '900',
  },
});
