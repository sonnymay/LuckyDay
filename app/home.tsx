import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { ChineseZodiacCard } from '../src/components/ChineseZodiacCard';
import { EnergyScoreCard } from '../src/components/EnergyScoreCard';
import { LuckyMetricCard } from '../src/components/LuckyMetricCard';
import { LuckyShareCard } from '../src/components/LuckyShareCard';
import { PremiumGate } from '../src/components/PremiumGate';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getPremiumStatus } from '../src/lib/purchases';
import { getNextMilestoneTarget, getReadingStreak, getStreakMilestone, shouldRequestRating } from '../src/lib/streak';
import { syncLocalDailyReminder } from '../src/lib/notifications';
import {
  getStoredProfile,
  getStoredReadingHistory,
  saveReadingHistoryItem,
  shouldScheduleNotificationToday,
  setNotificationScheduledToday,
} from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { DailyReading, Profile } from '../src/types';

// Lazy-load StoreReview — not available on web
async function requestStoreReviewIfAvailable() {
  try {
    const StoreReview = await import('expo-store-review');
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    }
  } catch {
    // expo-store-review not installed or not available — no-op
  }
}

// Lazy haptic helpers
async function triggerLightHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

async function triggerSuccessHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // expo-haptics not installed — no-op
  }
}

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
      style={[
        { width, height, borderRadius: 12, backgroundColor: colors.roseGold, opacity },
        style,
      ]}
    />
  );
}

function HomeSkeleton() {
  return (
    <View style={styles.skeletonScreen}>
      {/* Header */}
      <View style={styles.skeletonHeader}>
        <View style={{ gap: 6 }}>
          <SkeletonBlock width={60} height={10} />
          <SkeletonBlock width={140} height={32} />
        </View>
        <SkeletonBlock width={80} height={32} />
      </View>
      {/* Score card */}
      <SkeletonBlock width="100%" height={160} style={{ borderRadius: 20 }} />
      {/* Metric grid */}
      <View style={styles.skeletonGrid}>
        <SkeletonBlock width="48%" height={100} style={{ borderRadius: 16 }} />
        <SkeletonBlock width="48%" height={100} style={{ borderRadius: 16 }} />
        <SkeletonBlock width="48%" height={100} style={{ borderRadius: 16 }} />
        <SkeletonBlock width="48%" height={100} style={{ borderRadius: 16 }} />
      </View>
      {/* Zodiac card */}
      <SkeletonBlock width="100%" height={100} style={{ borderRadius: 20 }} />
      {/* Almanac card */}
      <SkeletonBlock width="100%" height={130} style={{ borderRadius: 20 }} />
    </View>
  );
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [streak, setStreak] = useState(0);
  const [savingShareCard, setSavingShareCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState<ReturnType<typeof getStreakMilestone>>(null);
  const shareCardRef = useRef<ViewShot>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.all([getStoredProfile(), getPremiumStatus()])
        .then(([storedProfile, premiumStatus]) => {
          if (!active) return;

          if (!storedProfile) {
            router.replace('/');
            return;
          }

          setIsPremium(premiumStatus.isPremium);
          const dailyReading = generateDailyReading(storedProfile);
          setProfile(storedProfile);
          setReading(dailyReading);
          // Reschedule notification with today's personalized data — but only once per day
          if (storedProfile.notificationTime) {
            shouldScheduleNotificationToday(dailyReading.date)
              .then((should) => {
                if (!should) return;
                return syncLocalDailyReminder(storedProfile.notificationTime, {
                  luckyColor: dailyReading.luckyColor,
                  luckyNumber: dailyReading.luckyNumber,
                  score: dailyReading.score,
                }).then(() => setNotificationScheduledToday(dailyReading.date));
              })
              .catch(() => undefined);
          }
          getStoredReadingHistory()
            .then((history) => {
              const nextHistory = [dailyReading, ...history.filter((item) => item.date !== dailyReading.date)];
              const currentStreak = getReadingStreak(nextHistory);
              setStreak(currentStreak);
              const milestone = getStreakMilestone(currentStreak);
              setStreakMilestone(milestone);
              if (milestone) triggerSuccessHaptic();
              if (shouldRequestRating(currentStreak)) {
                // Small delay so the screen has rendered before the system dialog appears
                setTimeout(() => requestStoreReviewIfAvailable(), 2000);
              }
              return saveReadingHistoryItem(dailyReading);
            })
            .catch(() => undefined);
        })
        .finally(() => {
          if (active) {
            setLoading(false);
            // Staggered entrance: fade in after data loads
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start();
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  if (loading || !profile || !reading) {
    return <HomeSkeleton />;
  }

  return (
    <Screen>
      <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{getDayGreeting().kicker}</Text>
          <Text style={styles.title}>{getDayGreeting().prefix} {profile.nickname}</Text>
        </View>
        <View style={styles.headerActions}>
          {!isPremium ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upgrade to premium"
              onPress={() => router.push('/paywall')}
              style={styles.upgradeButton}
            >
              <Text style={styles.upgradeText}>✨ Upgrade</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/settings')}
            style={styles.settings}
          >
            <Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </View>
      </View>

      <EnergyScoreCard label="✨ Today's luck energy" score={reading.score} message={reading.mainMessage} />

      {/* ── Daily wisdom quote — visible to all users, changes daily ── */}
      {reading.fortuneQuote ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Read today's full reading"
          onPress={() => { triggerLightHaptic(); router.push('/detail'); }}
          style={({ pressed }) => [styles.quoteStrip, pressed && styles.quoteStripPressed]}
        >
          <Text style={styles.quoteDecor}>❝</Text>
          <Text style={styles.quoteStripText} numberOfLines={2}>{reading.fortuneQuote}</Text>
          <Text style={styles.quoteStripArrow}>›</Text>
        </Pressable>
      ) : null}

      <PremiumGate isPremium={isPremium} featureLabel="your lucky metrics">
        <View style={styles.grid}>
          <LuckyMetricCard label="🔢 Lucky number" value={String(reading.luckyNumber)} variant="number" />
          <LuckyMetricCard
            label="🎨 Lucky color"
            note={getLuckyColorMeaning(reading.luckyColor)}
            value={reading.luckyColor}
            swatchColor={getLuckyColorHex(reading.luckyColor)}
          />
          <LuckyMetricCard label="⏰ Lucky time" value={reading.luckyTime} />
          <LuckyMetricCard label="🧭 Direction" value={reading.luckyDirection} variant="direction" />
        </View>
      </PremiumGate>

      <ChineseZodiacCard
        animal={reading.chineseZodiac}
        westernSign={reading.westernZodiac || undefined}
        insight={reading.zodiacInsight ?? undefined}
        westernInsight={reading.westernZodiacInsight || undefined}
      />

      {/* ── Moon phase — visible to all users, tappable to detail ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Moon phase: ${reading.moonPhase}. Tap to see full reading.`}
        onPress={() => { triggerLightHaptic(); router.push('/detail'); }}
        style={({ pressed }) => [styles.moonStrip, pressed && { opacity: 0.78 }]}
      >
        <Text style={styles.moonEmoji}>{getMoonEmoji(reading.moonPhase)}</Text>
        <View style={styles.moonCopy}>
          <View style={styles.moonPhaseLabelRow}>
            <Text style={styles.moonPhaseLabel}>🌙 {reading.moonPhase}</Text>
            {reading.lunarDate ? <Text style={styles.lunarDate}>{reading.lunarDate}</Text> : null}
          </View>
          <Text style={styles.moonPhaseMessage}>{reading.moonMessage}</Text>
        </View>
        <Text style={styles.moonArrow}>›</Text>
      </Pressable>

      <PremiumGate isPremium={isPremium} featureLabel="the Chinese Almanac">
        <Card style={styles.luckyCard}>
          {/* Almanac provenance badge */}
          <View style={styles.almanacRow}>
            <Text style={styles.almanacBadge}>📖 From the Chinese Almanac</Text>
            {reading.lunarDate ? <Text style={styles.almanacDate}>{reading.lunarDate}</Text> : null}
          </View>
          {reading.solarTerm ? <Text style={styles.solarTerm}>✦ {reading.solarTerm}</Text> : null}
          <View style={styles.divider} />
          <SectionRow label="🌿 Good for today" value={reading.goodFor.join(' · ')} />
          <View style={styles.divider} />
          <SectionRow label="🧿 Avoid today" value={reading.avoid.join(' · ')} />
        </Card>
      </PremiumGate>

      <PremiumGate isPremium={isPremium} featureLabel="your daily action">
        <Card style={styles.guidanceCard}>
          <SectionRow label="🍀 Small action" value={reading.action} />
        </Card>
      </PremiumGate>

      <Card style={styles.sharePromptCard}>
        <View style={styles.sharePromptHeader}>
          <View style={styles.shareMiniCard} pointerEvents="none">
            <Text style={styles.shareMiniStars}>✦ ✧</Text>
            <View style={styles.shareMiniOrb}>
              <Text style={styles.shareMiniScore}>{reading.score}</Text>
            </View>
            <View style={styles.shareMiniFooter}>
              <View style={[styles.shareMiniSwatch, { backgroundColor: getLuckyColorHex(reading.luckyColor) }]} />
              <Text style={styles.shareMiniNumber}>{reading.luckyNumber}</Text>
            </View>
          </View>
          <View style={styles.sharePromptCopy}>
            <Text style={styles.sharePromptTitle}>Send a little luck</Text>
            <Text style={styles.sharePromptText}>
              {getShareNudge(reading)} No birthday, photos, or private details.
            </Text>
          </View>
        </View>
        <View style={styles.sharePills}>
          <Text style={styles.sharePill}>IG / LINE ready</Text>
          <Text style={styles.sharePill}>No private details</Text>
        </View>
      </Card>

      <AppButton
        label={savingShareCard ? 'Saving your luck...' : 'Save & share my luck'}
        onPress={() => saveShareCard(reading, shareCardRef, setSavingShareCard)}
      />

      {!isPremium ? (
        <Card style={styles.premiumTeaserCard}>
          <View style={styles.premiumTeaserHeader}>
            <Text style={styles.premiumTeaserEmoji}>💫</Text>
            <View style={styles.premiumTeaserCopy}>
              <Text style={styles.premiumTeaserTitle}>Go deeper when you’re ready</Text>
              <Text style={styles.premiumTeaserText}>
                Premium adds richer readings, longer history, and future photo insights without interrupting your daily luck ritual.
              </Text>
            </View>
          </View>
          <View style={styles.premiumTeaserPills}>
            <Text style={styles.premiumTeaserPill}>Deep readings</Text>
            <Text style={styles.premiumTeaserPill}>History</Text>
            <Text style={styles.premiumTeaserPill}>Photo insights</Text>
          </View>
          <Pressable onPress={() => router.push('/paywall')} style={({ pressed }) => [styles.premiumTeaserButton, pressed && styles.premiumTeaserPressed]}>
            <Text style={styles.premiumTeaserButtonText}>See Premium ✨</Text>
          </Pressable>
        </Card>
      ) : null}

      {/* Streak milestone celebration */}
      {streakMilestone ? (
        <Card style={styles.milestoneCard}>
          <Text style={styles.milestoneEmoji}>{streakMilestone.emoji}</Text>
          <Text style={styles.milestoneDays}>{streakMilestone.days}-day streak</Text>
          <Text style={styles.milestoneMessage}>{streakMilestone.message}</Text>
        </Card>
      ) : null}

      <Card style={styles.streakCard}>
        <Text style={styles.streakLabel}>Daily ritual streak</Text>
        {streak === 0 ? (
          <>
            <Text style={styles.streakValue}>Start your ritual today ✨</Text>
            <Text style={styles.streakCopy}>Open LuckyDay each morning to build your streak.</Text>
          </>
        ) : (
          <>
            <Text style={styles.streakValue}>{streak} {streak === 1 ? 'day' : 'days'} ✨</Text>
            {/* Progress bar toward next milestone */}
            <View style={styles.streakProgressTrack}>
              <View style={[styles.streakProgressFill, { width: `${getStreakProgressPercent(streak)}%` }]} />
            </View>
            <Text style={styles.streakCopy}>
              {getStreakCopy(streak)}
            </Text>
          </>
        )}
      </Card>

      <View style={styles.navGrid}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View daily reading detail"
          style={({ pressed }) => [styles.navCard, pressed && styles.navCardPressed]}
          onPress={() => { triggerLightHaptic(); router.push('/detail'); }}
        >
          <Text style={styles.navEmoji}>📋</Text>
          <Text style={styles.navLabel}>Daily{'\n'}detail</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View reading history"
          style={({ pressed }) => [styles.navCard, pressed && styles.navCardPressed]}
          onPress={() => { triggerLightHaptic(); router.push('/history'); }}
        >
          <Text style={styles.navEmoji}>📖</Text>
          <Text style={styles.navLabel}>Reading{'\n'}history</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rate today's reading"
          style={({ pressed }) => [styles.navCard, pressed && styles.navCardPressed]}
          onPress={() => { triggerLightHaptic(); router.push('/feedback'); }}
        >
          <Text style={styles.navEmoji}>⭐</Text>
          <Text style={styles.navLabel}>Rate{'\n'}today</Text>
        </Pressable>
      </View>

      <View style={[styles.captureArea, styles.noPointerEvents]}>
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
          <LuckyShareCard reading={reading} />
        </ViewShot>
      </View>
      </Animated.View>
    </Screen>
  );
}

async function saveShareCard(
  reading: DailyReading,
  shareCardRef: RefObject<ViewShot | null>,
  setSavingShareCard: (saving: boolean) => void,
) {
  if (savingFallbackNeeded()) {
    await Share.share({
      message: `A little luck for today ✨ My LuckyDay energy is ${reading.score}. ${reading.mainMessage} Lucky color: ${reading.luckyColor}. Lucky number: ${reading.luckyNumber}.`,
    });
    return;
  }

  try {
    setSavingShareCard(true);
    const uri = await shareCardRef.current?.capture?.();
    if (!uri) {
      Alert.alert('Share card not ready', 'Please try again in a moment.');
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) {
      Alert.alert(
        'Photos permission needed',
        'Allow photo access to save your LuckyDay card. You can change this in Settings anytime.',
      );
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Saved to your photos ✨', 'Your LuckyDay card is ready in your camera roll.');
      return;
    }

    Alert.alert('Saved to your photos ✨', 'Your LuckyDay card is ready. Want to share it now?', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Send luck',
        onPress: () => {
          Sharing.shareAsync(uri, {
            dialogTitle: "Share today's LuckyDay",
            mimeType: 'image/png',
            UTI: 'public.png',
          });
        },
      },
    ]);
  } catch {
    Alert.alert('Could not save card', 'Please try again in a moment.');
  } finally {
    setSavingShareCard(false);
  }
}

function savingFallbackNeeded() {
  return Platform.OS === 'web';
}

function getStreakCopy(streak: number): string {
  const next = getNextMilestoneTarget(streak);
  if (next) {
    const diff = next - streak;
    return `${diff} more day${diff === 1 ? '' : 's'} to your ${next}-day milestone.`;
  }
  return 'You have reached the highest milestone. Keep the ritual alive every day.';
}

function getDayGreeting(): { kicker: string; prefix: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { kicker: '🌙 Late night', prefix: 'Burning midnight oil,' };
  if (hour < 12) return { kicker: '🌅 Good morning', prefix: 'Morning,' };
  if (hour < 17) return { kicker: '☀️ Good afternoon', prefix: 'Afternoon,' };
  if (hour < 20) return { kicker: '🌇 Good evening', prefix: 'Evening,' };
  return { kicker: '🌙 Good evening', prefix: 'Evening,' };
}

function getStreakProgressPercent(streak: number): number {
  const MILESTONES = [7, 14, 30, 60, 100];
  const next = getNextMilestoneTarget(streak);
  if (!next) return 100;
  const prevIndex = MILESTONES.indexOf(next) - 1;
  const prev = prevIndex >= 0 ? MILESTONES[prevIndex] : 0;
  return Math.min(100, Math.round(((streak - prev) / (next - prev)) * 100));
}

function getMoonEmoji(moonPhase: string): string {
  const map: Record<string, string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
  };
  return map[moonPhase] ?? '🌙';
}

function getShareNudge(reading: DailyReading) {
  const colorMeaning = getLuckyColorMeaning(reading.luckyColor).toLowerCase();
  return `Save a cute story card for someone who could use ${colorMeaning} today.`;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  skeletonScreen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  skeletonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  upgradeButton: {
    backgroundColor: colors.mauve,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  upgradeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  settings: {
    padding: spacing.sm,
  },
  settingsText: {
    color: colors.mauve,
    fontSize: 15,
    fontWeight: '800',
  },
  // Fortune quote strip
  quoteStrip: {
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quoteStripPressed: {
    opacity: 0.76,
  },
  quoteDecor: {
    color: '#7B6CB8',
    fontSize: 22,
    lineHeight: 26,
    opacity: 0.7,
  },
  quoteStripText: {
    color: '#3D2D80',
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 20,
  },
  quoteStripArrow: {
    color: '#7B6CB8',
    fontSize: 22,
    fontWeight: '900',
    opacity: 0.7,
  },
  // Moon phase strip
  moonStrip: {
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  moonEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  moonCopy: {
    flex: 1,
  },
  moonPhaseLabelRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  moonPhaseLabel: {
    color: '#3D2D80',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  lunarDate: {
    color: '#7B6CB8',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.85,
  },
  moonPhaseMessage: {
    color: '#5A4A90',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 3,
  },
  moonArrow: {
    color: '#7B6CB8',
    fontSize: 22,
    fontWeight: '900',
    opacity: 0.7,
  },
  luckyCard: {
    backgroundColor: '#FBF5E8',
    borderColor: colors.roseGold,
  },
  almanacRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  almanacBadge: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  almanacDate: {
    color: colors.goldDeep,
    fontSize: 14,
    fontWeight: '800',
  },
  solarTerm: {
    color: colors.mauve,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  guidanceCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
  },
  sharePromptCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    gap: spacing.md,
  },
  sharePromptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  sharePromptCopy: {
    flex: 1,
  },
  shareMiniCard: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    borderRadius: 16,
    borderWidth: 1.5,
    height: 102,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: spacing.xs,
    width: 68,
  },
  shareMiniStars: {
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '900',
  },
  shareMiniOrb: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  shareMiniScore: {
    color: colors.goldDeep,
    fontSize: 18,
    fontWeight: '900',
  },
  shareMiniFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  shareMiniSwatch: {
    borderColor: colors.luckyGold,
    borderRadius: 7,
    borderWidth: 1,
    height: 14,
    width: 14,
  },
  shareMiniNumber: {
    color: colors.champagne,
    fontSize: 14,
    fontWeight: '900',
  },
  sharePromptTitle: {
    color: colors.mauve,
    fontSize: 20,
    fontWeight: '900',
  },
  sharePromptText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sharePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sharePill: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  premiumTeaserCard: {
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    gap: spacing.md,
    overflow: 'hidden',
  },
  premiumTeaserHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  premiumTeaserEmoji: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 24,
    borderWidth: 1.5,
    fontSize: 24,
    height: 48,
    lineHeight: 45,
    overflow: 'hidden',
    textAlign: 'center',
    width: 48,
  },
  premiumTeaserCopy: {
    flex: 1,
  },
  premiumTeaserTitle: {
    color: colors.champagne,
    fontSize: 20,
    fontWeight: '900',
  },
  premiumTeaserText: {
    color: '#FCEEF1',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  premiumTeaserPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  premiumTeaserPill: {
    backgroundColor: 'rgba(255, 247, 214, 0.16)',
    borderColor: 'rgba(255, 214, 114, 0.5)',
    borderRadius: 999,
    borderWidth: 1,
    color: colors.champagne,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  premiumTeaserButton: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: spacing.sm,
  },
  premiumTeaserPressed: {
    opacity: 0.82,
  },
  premiumTeaserButtonText: {
    color: colors.goldDeep,
    fontSize: 15,
    fontWeight: '900',
  },
  milestoneCard: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  milestoneEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  milestoneDays: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  milestoneMessage: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
  },
  streakProgressTrack: {
    backgroundColor: 'rgba(154, 100, 16, 0.15)',
    borderRadius: radii.pill,
    height: 6,
    marginTop: spacing.sm,
    overflow: 'hidden',
    width: '100%',
  },
  streakProgressFill: {
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    height: '100%',
  },
  streakLabel: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  streakValue: {
    color: colors.mauve,
    fontSize: 34,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  streakCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  navGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  navCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 20,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  navCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  navEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  navLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  captureArea: {
    left: -10000,
    position: 'absolute',
    top: 0,
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
});
