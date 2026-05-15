import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
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
import {
  getFeedbackForDate,
  getJournalEntry,
  getRitualDone,
  getSeenMilestones,
  getStoredProfile,
  getStoredReadingHistory,
  markMilestoneSeen,
  saveReadingHistoryItem,
  setJournalEntry,
  setRitualDone,
} from '../src/lib/storage';
import { Milestone, selectMilestoneToShow } from '../src/lib/milestones';
import { MilestoneModal } from '../src/components/MilestoneModal';
import { formatNextSolarTermHint, getNextSolarTerm } from '../src/lib/almanac';
import { formatAuspiciousBadgeLabel, getAuspiciousDay } from '../src/lib/auspiciousDay';
import { formatDoubleHourChip, getCurrentDoubleHour } from '../src/lib/chineseHour';
import { todayKey } from '../src/lib/date';
import { formatWindowHint, getWindowState, parseTimeWindow } from '../src/lib/timeWindow';
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
  const [tomorrowReading, setTomorrowReading] = useState<DailyReading | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [weekPattern, setWeekPattern] = useState<WeekPattern | null>(null);
  const [journalText, setJournalText] = useState('');
  const [ritualDone, setRitualDoneState] = useState(false);
  const journalInputRef = useRef<TextInput>(null);
  const ritualSparkleAnim = useRef(new Animated.Value(0)).current;
  const [nickname, setNickname] = useState<string>('');
  const [mainFocuses, setMainFocuses] = useState<MainFocus[]>(['Luck']);
  const [streak, setStreak] = useState(0);
  const [nextMilestoneTarget, setNextMilestoneTarget] = useState<number | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [milestoneToShow, setMilestoneToShow] = useState<Milestone | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  // True only when today's reading was NOT yet in history when this screen
  // loaded — used to fire the late-night "streak saved" celebration pill.
  const [savedAtTheWire, setSavedAtTheWire] = useState(false);
  const [yesterdayPrompt, setYesterdayPrompt] = useState<{ date: string; tier: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Refresh `now` every minute so the Best-time progress bar ticks live.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // When the app returns from background and the date has rolled past
  // midnight, force a hard reload so the user sees today's almanac rather
  // than yesterday's stale reading.
  // Single source of truth for loading the reading + streak + milestone state.
  // Called by useFocusEffect on screen focus, and by the AppState listener
  // when the app returns to active after midnight rollover.
  const loadReading = useCallback(() => {
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
      // Tomorrow preview drives the return-loop. Compute on focus so a
      // user opening at 23:59 vs 00:01 sees the right "tomorrow."
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      setTomorrowReading(generateDailyReading(profile, tomorrowDate));
      // Load any prior journal entry + ritual completion for today so the
      // UI re-hydrates after a session restart or tab change.
      getJournalEntry(todayReading.date)
        .then((existing) => {
          if (active) setJournalText(existing);
        })
        .catch(() => undefined);
      getRitualDone(todayReading.date)
        .then((done) => {
          if (active) setRitualDoneState(done);
        })
        .catch(() => undefined);
      const nextHistory = [todayReading, ...history.filter((item) => item.date !== todayReading.date)];
      const currentStreak = getReadingStreak(nextHistory);
      setStreak(currentStreak);
      setNextMilestoneTarget(getNextMilestoneTarget(currentStreak));

      // Fire the "saved at the wire" pill only when today is genuinely new
      // (no prior entry for this date in history) AND it's late evening AND
      // the streak is alive. Compute BEFORE we save below so the check
      // reflects the on-disk state from before this visit.
      const wasNewToday = !history.some((item) => item.date === todayReading.date);
      const localHour = new Date().getHours();
      setSavedAtTheWire(wasNewToday && currentStreak >= 1 && localHour >= 21);

      saveReadingHistoryItem(todayReading).catch(() => undefined);

      // Pick the largest unseen streak milestone the user just earned.
      getSeenMilestones()
        .then((seen) => {
          if (!active) return;
          const next = selectMilestoneToShow(currentStreak, seen);
          if (next) setMilestoneToShow(next);
        })
        .catch(() => undefined);

      // Find the most recent reading that isn't today
      const past = history.filter((h) => h.date !== todayReading.date);

      // Weekly pattern — bucket the last 7 days of readings (incl. today)
      // by tier. Show only with ≥5 days of data so the pattern is real,
      // not noise from a fresh install. Pattern recognition is the #1
      // stickiness driver at day 7+ in almanac-class apps.
      const lastSeven = [todayReading, ...past].slice(0, 7);
      setWeekPattern(lastSeven.length >= 5 ? bucketWeekPattern(lastSeven) : null);
      if (past.length > 0) {
        setYesterdayScore(past[0].score);
      } else {
        setYesterdayScore(null);
      }

      // Yesterday-reflection prompt: only show if there's a prior reading,
      // no feedback recorded for it, and it's past 8am local (don't ambush
      // sleepy users mid-morning ritual). Drives the accuracy celebration
      // loop in History — without reflections that block never fires.
      const yesterdayReading = past[0];
      if (yesterdayReading && new Date().getHours() >= 8) {
        getFeedbackForDate(yesterdayReading.date)
          .then((existing) => {
            if (!active) return;
            if (!existing) {
              setYesterdayPrompt({
                date: yesterdayReading.date,
                tier: getReadingTierLabel(yesterdayReading.score),
              });
            } else {
              setYesterdayPrompt(null);
            }
          })
          .catch(() => undefined);
      } else {
        setYesterdayPrompt(null);
      }

      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });

    return () => {
      active = false;
    };
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const cleanup = loadReading();
      return cleanup;
    }, [loadReading]),
  );

  // When the app returns from background and the date has rolled past
  // midnight, force a hard reload so the user sees today's almanac rather
  // than yesterday's stale reading.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (!reading) return;
      const currentDayKey = todayKey();
      if (currentDayKey !== reading.date) {
        loadReading();
      }
    });
    return () => sub.remove();
  }, [reading, loadReading]);

  if (loading || !reading) {
    return <DetailSkeleton />;
  }

  const insightRows = getInsightRows(reading, mainFocuses);
  const visibleInsights = showAllInsights ? insightRows : insightRows.slice(0, 3);
  const hiddenInsightCount = Math.max(0, insightRows.length - 3);
  const actionSentence = getActionSentence(reading.action);

  const handleRitualTap = () => {
    if (ritualDone || !reading) return;
    setRitualDoneState(true);
    setRitualDone(reading.date, true).catch(() => undefined);
    Animated.sequence([
      Animated.timing(ritualSparkleAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(ritualSparkleAnim, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
    // Pull the user straight into the journal field — closes the loop:
    // "did it" → "how did it go?" without making them hunt for the input.
    setTimeout(() => journalInputRef.current?.focus(), 280);
  };

  return (
    <Screen showTabBar tintColor={getLuckyColorHex(reading.luckyColor)}>
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.brandRow}>
        <Text style={styles.brandMark}>LuckyDay</Text>
        <Text style={styles.brandSub}>{formatReadingDate(reading)}</Text>
        <Text
          accessibilityRole="text"
          accessibilityLabel={`Current double-hour: ${getCurrentDoubleHour(now).animal} hour, ${getCurrentDoubleHour(now).range}`}
          style={styles.doubleHourChip}
        >
          {formatDoubleHourChip(getCurrentDoubleHour(now))}
        </Text>
        {(() => {
          const hint = formatNextSolarTermHint(getNextSolarTerm(new Date(`${reading.date}T00:00:00`)));
          return hint ? (
            <Text accessibilityRole="text" accessibilityLabel={hint} style={styles.solarTermChip}>
              {hint}
            </Text>
          ) : null;
        })()}
        {(() => {
          const auspicious = getAuspiciousDay(new Date(`${reading.date}T00:00:00`));
          const label = formatAuspiciousBadgeLabel(auspicious);
          if (label && auspicious) {
            return (
              <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${label}. ${auspicious.meaning}`}
                style={styles.auspiciousBadge}
              >
                <Text style={styles.auspiciousBadgeText}>{label}</Text>
                <Text style={styles.auspiciousBadgeMeaning}>{auspicious.meaning}</Text>
              </View>
            );
          }
          // Neutral fallback — the slot is always filled so users learn to
          // trust it, and the contrast on auspicious days lands harder.
          const neutral = getNeutralDayCopy(reading.moonPhase);
          return (
            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${neutral.label}. ${neutral.meaning}`}
              style={styles.neutralBadge}
            >
              <Text style={styles.neutralBadgeText}>{neutral.label}</Text>
              <Text style={styles.neutralBadgeMeaning}>{neutral.meaning}</Text>
            </View>
          );
        })()}
      </View>
      <Text style={styles.pageTitle}>{getGreeting(nickname, now)}</Text>

      {/* ── Energy score orb — the headline number ── */}
      <EnergyScoreCard score={reading.score} message={reading.mainMessage} />

      <View style={styles.streakRow}>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>{getStreakLabel(streak)}</Text>
        </View>
        {nextMilestoneTarget && streak > 0 ? (
          <Text style={styles.streakHint}>
            {nextMilestoneTarget - streak === 1 ? 'Tomorrow opens a new chapter' : 'A few more mornings opens a new chapter'}
          </Text>
        ) : null}
        {savedAtTheWire ? (
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Streak saved with ${minutesUntilMidnight(now)} to spare`}
            style={styles.streakSavePill}
          >
            <Text style={styles.streakSavePillText}>
              ✦ Streak saved with {formatMinutes(minutesUntilMidnight(now))} to spare
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Weekly pattern — pattern recognition is the day-7+ stickiness driver ── */}
      {weekPattern ? (
        <Card style={styles.weekPatternCard}>
          <Text style={styles.weekPatternLabel}>Your last {weekPattern.total} days</Text>
          <View style={styles.weekPatternRow}>
            {formatWeekPatternParts(weekPattern).map((part) => (
              <View key={part.label} style={styles.weekPatternChip}>
                <View style={[styles.weekPatternDot, { backgroundColor: part.color }]} />
                <Text style={styles.weekPatternCount}>{part.count}</Text>
                <Text style={styles.weekPatternChipLabel}>{part.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* ── Yesterday reflection prompt — feeds the accuracy loop ── */}
      {yesterdayPrompt ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reflect on yesterday, a ${yesterdayPrompt.tier} day`}
          onPress={() => {
            setYesterdayPrompt(null);
            router.push({ pathname: '/feedback', params: { date: yesterdayPrompt.date } });
          }}
          style={({ pressed }) => [styles.reflectPrompt, pressed && styles.reflectPromptPressed]}
        >
          <View style={styles.reflectPromptCopy}>
            <Text style={styles.reflectPromptKicker}>Before today</Text>
            <Text style={styles.reflectPromptTitle}>
              Yesterday was a {yesterdayPrompt.tier} day
            </Text>
            <Text style={styles.reflectPromptSub}>How did it actually feel? · 30 seconds</Text>
          </View>
          <View style={styles.reflectPromptCta}>
            <Text style={styles.reflectPromptCtaText}>Reflect</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </View>
        </Pressable>
      ) : null}

      {/* ── Action hero — the #1 thing to do today ── */}
      <Card style={styles.actionCard}>
        <Text style={styles.actionLabel}>🍀 Your ritual for today</Text>
        <Text style={[styles.actionText, ritualDone && styles.actionTextDone]}>{actionSentence}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ritualDone ? 'Ritual complete for today' : 'Mark ritual done'}
          accessibilityState={{ disabled: ritualDone }}
          disabled={ritualDone}
          onPress={handleRitualTap}
          style={({ pressed }) => [
            styles.ritualTap,
            ritualDone && styles.ritualTapDone,
            pressed && !ritualDone && styles.ritualTapPressed,
          ]}
        >
          <Text style={styles.ritualTapText}>{ritualDone ? '✓ Done — well done' : 'I did this today ✓'}</Text>
        </Pressable>
        <Animated.Text
          pointerEvents="none"
          style={[
            styles.ritualSparkle,
            {
              opacity: ritualSparkleAnim,
              transform: [
                {
                  scale: ritualSparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }),
                },
              ],
            },
          ]}
        >
          ✦ ✧ ✦
        </Animated.Text>
      </Card>

      {/* ── Daily journal — personal artifact, the strongest churn defense ── */}
      <View style={styles.journalGroup}>
        <Text style={styles.journalLabel}>What's on your mind today?</Text>
        <View style={styles.journalCard}>
          <TextInput
            ref={journalInputRef}
            accessibilityLabel="Daily journal entry"
            multiline
            onBlur={() => {
              if (reading) setJournalEntry(reading.date, journalText).catch(() => undefined);
            }}
            onChangeText={setJournalText}
            placeholder={ritualDone ? 'How did it go?' : 'A line for your future self…'}
            placeholderTextColor={colors.faint}
            style={styles.journalInput}
            value={journalText}
          />
        </View>
      </View>

      {/* ── Best time — live progress through the window ── */}
      {(() => {
        const parsed = parseTimeWindow(reading.luckyTime);
        const state = parsed ? getWindowState(parsed, now) : null;
        const a11yState =
          state?.state === 'active'
            ? `currently active, ${Math.round(state.progress * 100)} percent through the window`
            : state?.state === 'before'
              ? `not yet started, begins in ${state.minutesUntilStart} minutes`
              : state?.state === 'after'
                ? `ended ${state.minutesSinceEnd} minutes ago`
                : 'today';
        return (
          <Card
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Best time today: ${reading.luckyTime}. ${a11yState}.`}
            style={styles.bestTimeCard}
          >
            <Text style={styles.bestTimeLabel}>⏰ Best time</Text>
            <Text style={styles.bestTimeValue}>{reading.luckyTime}</Text>
            {state?.state === 'active' ? (
              <View style={styles.bestTimeProgressTrack}>
                <View
                  style={[
                    styles.bestTimeProgressFill,
                    { width: `${Math.round(state.progress * 100)}%` },
                  ]}
                />
              </View>
            ) : state ? (
              (() => {
                const hint = formatWindowHint(state);
                return hint ? <Text style={styles.bestTimeHint}>{hint}</Text> : null;
              })()
            ) : null}
          </Card>
        );
      })()}

      {/* ── Good for / Avoid — immediate dashboard guidance ── */}
      {(reading.goodFor?.length > 0 || reading.avoid?.length > 0) ? (
        <View style={styles.almanacBlock}>
          <View style={styles.pillsRow}>
            {reading.goodFor?.length > 0 ? (
              <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Almanac suggests today is good for: ${reading.goodFor.join(', ')}`}
                style={[styles.pillsGroup, styles.goodGroup]}
              >
                <Text style={styles.pillsLabel}>✅ Good for</Text>
                <View style={styles.pillsWrap}>
                  {reading.goodFor.map((item) => (
                    <Text key={item} style={styles.goodPill}>{item}</Text>
                  ))}
                </View>
              </View>
            ) : null}
            {reading.avoid?.length > 0 ? (
              <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Almanac suggests being cautious of: ${reading.avoid.join(', ')}`}
                style={[styles.pillsGroup, styles.avoidGroup]}
              >
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
          <Text style={styles.quickLabel}>Color</Text>
          <Text style={styles.quickValue}>{reading.luckyColor}</Text>
          <Text style={styles.colorMeaning}>{getLuckyColorMeaning(reading.luckyColor)}</Text>
          <Text style={styles.colorRitual}>Wear or carry {reading.luckyColor.toLowerCase()} today to align your energy.</Text>
        </View>
        <View style={{ flex: 2, gap: spacing.md }}>
          <View style={[styles.quickCard, styles.numberQuickCard, { flex: 1 }]}>
            <Text style={styles.quickLabel}>Number</Text>
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

      {/* ── Tomorrow preview — closes the return-loop with a real tier + delta ── */}
      {tomorrowReading ? (
        <Card style={styles.tomorrowCard}>
          <View
            style={[
              styles.tomorrowSwatch,
              { backgroundColor: getLuckyColorHex(tomorrowReading.luckyColor) },
            ]}
          />
          <View style={styles.tomorrowBody}>
            <Text style={styles.tomorrowLabel}>Tomorrow's almanac</Text>
            <Text style={styles.tomorrowTitle}>
              {getReadingTierLabel(tomorrowReading.score)} day {getTomorrowDeltaArrow(tomorrowReading.score, reading.score)}
            </Text>
            <Text style={styles.tomorrowCopy}>
              {getTomorrowCopy(tomorrowReading.score, reading.score)}
            </Text>
          </View>
        </Card>
      ) : null}

      {/* ── Share CTA ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send today's almanac to someone"
        disabled={isSharing}
        onPress={() => {
          if (isSharing) return;
          setIsSharing(true);
          triggerShareHaptic();
          shareReading(reading).finally(() => setIsSharing(false));
        }}
        style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed, isSharing && styles.shareButtonDisabled]}
      >
        <Ionicons name="share-outline" size={20} color={colors.mauve} />
        <Text style={styles.shareButtonText}>Send today's almanac ✦</Text>
      </Pressable>
    </Animated.View>

    <MilestoneModal
      milestone={milestoneToShow}
      onDismiss={() => {
        if (milestoneToShow) {
          markMilestoneSeen(milestoneToShow.days).catch(() => undefined);
        }
        setMilestoneToShow(null);
      }}
    />
    </Screen>
  );
}

// Bands rendered on-brand: inactive blush, active champagne — orb + halo
// already carry the score weight, so the scale row is supportive, not loud.
const SCORE_BANDS = [
  { label: 'Rest',   min: 0,  max: 56,  color: colors.blush },
  { label: 'Steady', min: 56, max: 65,  color: colors.blush },
  { label: 'Good',   min: 65, max: 75,  color: colors.blush },
  { label: 'Strong', min: 75, max: 85,  color: colors.blush },
  { label: 'Peak',   min: 85, max: 101, color: colors.blush },
];

function getNeutralDayCopy(moonPhase: string): { label: string; meaning: string } {
  // Map moon phases to a small neutral-day frame so the auspicious slot is
  // always filled. Pattern matches the auspicious tone: short title + one
  // actionable line. Falls back to a generic open-day frame.
  const map: Record<string, { label: string; meaning: string }> = {
    'New Moon':         { label: 'Quiet day · New Moon',          meaning: 'A fresh page. Begin small.' },
    'Waxing Crescent':  { label: 'Open day · Waxing Crescent',     meaning: 'No special tide. Build your own tone.' },
    'First Quarter':    { label: 'Steady day · First Quarter',     meaning: 'Push gently — the week is rising.' },
    'Waxing Gibbous':   { label: 'Building day · Waxing Gibbous',  meaning: 'Refine, do not rush. Energy gathers.' },
    'Full Moon':        { label: 'Full day · Full Moon',           meaning: 'Hold steady at the peak. Notice everything.' },
    'Waning Gibbous':   { label: 'Releasing day · Waning Gibbous', meaning: 'Let unfinished things settle on their own.' },
    'Last Quarter':     { label: 'Clearing day · Last Quarter',    meaning: 'Tidy what is open before you start anything new.' },
    'Waning Crescent':  { label: 'Resting day · Waning Crescent',  meaning: 'Conserve. Strain costs more today.' },
  };
  return map[moonPhase] ?? { label: 'Open day', meaning: 'No special tide. Your own pace sets the day.' };
}

function getReadingTierLabel(score: number): string {
  if (score >= 85) return 'Peak';
  if (score >= 75) return 'Strong';
  if (score >= 65) return 'Good';
  if (score >= 56) return 'Steady';
  return 'Rest';
}

type WeekPattern = {
  total: number;
  peak: number;
  strong: number;
  good: number;
  steady: number;
  rest: number;
};

function bucketWeekPattern(readings: DailyReading[]): WeekPattern {
  const p: WeekPattern = { total: readings.length, peak: 0, strong: 0, good: 0, steady: 0, rest: 0 };
  for (const r of readings) {
    if (r.score >= 85) p.peak += 1;
    else if (r.score >= 75) p.strong += 1;
    else if (r.score >= 65) p.good += 1;
    else if (r.score >= 56) p.steady += 1;
    else p.rest += 1;
  }
  return p;
}

function formatWeekPatternParts(p: WeekPattern): { label: string; count: number; color: string }[] {
  // Collapse Peak into Strong for the chip row (visual simplicity).
  // Order: ascending energy so the eye reads "rest → steady → strong".
  const parts = [
    { label: 'rest',   count: p.rest,                    color: '#A87B97' }, // colors.faint
    { label: 'steady', count: p.steady,                  color: '#C03A78' }, // colors.mauve
    { label: 'good',   count: p.good,                    color: '#D690B0' }, // colors.roseGold
    { label: 'strong', count: p.strong + p.peak,         color: '#9A6410' }, // colors.goldDeep
  ];
  return parts.filter((part) => part.count > 0);
}

function getTomorrowDeltaArrow(tomorrow: number, today: number): string {
  const delta = tomorrow - today;
  if (delta >= 3) return `↑ ${delta}`;
  if (delta <= -3) return `↓ ${Math.abs(delta)}`;
  return '·';
}

function getTomorrowCopy(tomorrow: number, today: number): string {
  const delta = tomorrow - today;
  if (delta >= 8) return 'A clear lift incoming — save bold moves for tomorrow.';
  if (delta >= 3) return 'Energy rises tomorrow — plan one important move.';
  if (delta <= -8) return 'A softer day ahead — wrap loose ends today if you can.';
  if (delta <= -3) return 'Quieter pace tomorrow — nothing wrong, just slower.';
  return 'A similar tone tomorrow — your rhythm stays the same.';
}

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
  if (streak <= 1) return 'Your first day back';
  return `${streak} days in a row`;
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

function shareReading(reading: DailyReading): Promise<unknown> {
  // Web has no real share sheet on most browsers — rather than failing
  // silently and looking broken, surface a one-line explanation. iOS
  // and Android use the native Share.share path.
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !('share' in navigator)) {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert('Sharing works on iOS — open this in the LuckyDay app.');
    }
    return Promise.resolve();
  }
  // Wrap in try/catch — web's navigator.share throws synchronously when
  // called concurrently (e.g. double-tap) which would propagate as an
  // uncaught error and trip the ErrorBoundary.
  try {
    return Promise.resolve(
      Share.share({
        message: [
          `My almanac reading for ${reading.date} ✨`,
          `\n"${reading.mainMessage}"`,
          `\n🎨 ${reading.luckyColor}  ·  🔢 ${reading.luckyNumber}  ·  ⏰ ${reading.luckyTime}  ·  🧭 ${reading.luckyDirection}`,
          reading.moonPhase ? `🌙 ${reading.moonPhase}` : '',
          `\n🍀 ${reading.action}`,
        ]
          .filter(Boolean)
          .join('\n'),
        title: "Today's almanac reading",
      }),
    ).catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

function formatReadingDate(reading: DailyReading): string {
  const date = new Date(`${reading.date}T00:00:00`);
  const displayDate = Number.isNaN(date.getTime())
    ? reading.date
    : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  // reading.solarTerm is now English-only (e.g. "Start of Summer").
  return [displayDate, reading.lunarDate, reading.solarTerm].filter(Boolean).join(' · ');
}

/** Whole minutes between `now` and the next local midnight. */
function minutesUntilMidnight(now: Date): number {
  return (24 - now.getHours()) * 60 - now.getMinutes();
}

/** Format minutes as "Xh Ym" or "Ym" — used in the streak-save pill. */
function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Returns the page-title greeting based on local hour of day so the screen
 * feels personal across morning / afternoon / evening / late-night opens.
 */
function getGreeting(nickname: string, now: Date): string {
  const hour = now.getHours();
  const name = nickname ? nickname : null;
  if (hour >= 5 && hour < 11) {
    return name ? `Good morning, ${name} ✨` : 'Good morning ✨';
  }
  if (hour >= 11 && hour < 17) {
    return name ? `${name}'s almanac today ✨` : "Today's Almanac ✨";
  }
  if (hour >= 17 && hour < 22) {
    return name ? `Welcome back, ${name} ✨` : 'Welcome back ✨';
  }
  // 22:00 - 04:59 — late night / early hours
  return name
    ? `Late night, ${name}. Tomorrow's almanac is ready.`
    : "Late night. Tomorrow's almanac is ready.";
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
  solarTermChip: {
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  doubleHourChip: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  auspiciousBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sunrise,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  auspiciousBadgeText: {
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  auspiciousBadgeMeaning: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  // Neutral fallback — same shape as auspicious badge but softer palette so
  // the slot reads as always-present without competing with the gold treatment
  // when the day actually qualifies.
  neutralBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  neutralBadgeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  neutralBadgeMeaning: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
    opacity: 0.85,
  },
  streakRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  streakSavePill: {
    backgroundColor: colors.sunrise,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  streakSavePillText: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  streakPill: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
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
  },
  scoreBandActive: {
    backgroundColor: colors.champagne,
    opacity: 1,
    ...Platform.select({
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  scoreBandLabel: {
    color: colors.mauve,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    opacity: 0.65,
    textTransform: 'uppercase',
  },
  scoreBandLabelActive: {
    color: colors.ink,
    opacity: 1,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  // Daily journal — personal artifact for churn defense
  journalGroup: {
    gap: 6,
    marginTop: -spacing.md + 8, // tighten coupling to action card above (~8px gap)
  },
  journalLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    paddingHorizontal: spacing.xs,
  },
  journalCard: {
    backgroundColor: colors.panel,
    borderColor: colors.luckyGold,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  journalInput: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    minHeight: 60,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  // Weekly pattern — colored chips, ascending energy
  weekPatternCard: {
    backgroundColor: colors.panel,
    borderColor: colors.roseGold,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.md,
  },
  weekPatternLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  weekPatternRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekPatternChip: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  weekPatternDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  weekPatternCount: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 16,
    fontWeight: '900',
  },
  weekPatternChipLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  // Yesterday-reflection prompt — feeds the accuracy loop in History
  // Subordinate to the action card — softer border + smaller padding so the
  // user reads "before today" as a side glance, not today's main guidance.
  reflectPrompt: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reflectPromptPressed: {
    opacity: 0.85,
  },
  reflectPromptCopy: {
    flex: 1,
    gap: 2,
  },
  reflectPromptKicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reflectPromptTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 1,
  },
  reflectPromptSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  reflectPromptCta: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  reflectPromptCtaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  actionText: {
    color: colors.white,
    fontFamily: fonts.heavy,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 30,
  },
  actionTextDone: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  // "I did this today ✓" — closes the ritual loop the app otherwise dangles
  ritualTap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 240, 199, 0.5)',
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  ritualTapPressed: {
    opacity: 0.78,
  },
  ritualTapDone: {
    backgroundColor: 'rgba(237, 186, 64, 0.22)',
    borderColor: colors.luckyGold,
  },
  ritualTapText: {
    color: colors.champagne,
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  ritualSparkle: {
    color: colors.luckyGold,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    pointerEvents: 'none',
    position: 'absolute',
    right: spacing.md,
    textAlign: 'center',
    top: spacing.md,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    opacity: 0.75,
  },
  bestTimeValue: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    textAlign: 'center',
  },
  bestTimeProgressTrack: {
    backgroundColor: 'rgba(154, 100, 16, 0.18)',
    borderRadius: radii.pill,
    height: 6,
    marginTop: spacing.xs,
    overflow: 'hidden',
    width: '70%',
  },
  bestTimeProgressFill: {
    backgroundColor: colors.goldDeep,
    borderRadius: radii.pill,
    height: '100%',
  },
  bestTimeHint: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.85,
  },
  // Color + number quick row
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
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
  colorRitual: {
    color: colors.mauve,
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 6,
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
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  influencesLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: spacing.xs,
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
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: colors.mauve,
    fontSize: 16,
    fontWeight: '900',
  },
  // Tomorrow preview — closes the return loop
  tomorrowCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  tomorrowSwatch: {
    borderColor: colors.luckyGold,
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    width: 44,
  },
  tomorrowBody: {
    flex: 1,
    gap: 2,
  },
  tomorrowLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tomorrowTitle: {
    color: colors.mauve,
    fontFamily: fonts.heavy,
    fontSize: 19,
    fontWeight: '900',
  },
  tomorrowCopy: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2,
  },
});
