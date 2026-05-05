import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { colors, fonts, radii, spacing } from '../src/styles/theme';
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

// Star positions: [left%, top%, fontSize, symbol, phaseOffset ms]
const STAR_PARTICLES: Array<[`${number}%`, `${number}%`, number, string, number]> = [
  ['8%',  '12%', 22, '✦', 0],
  ['78%', '8%',  16, '✧', 200],
  ['55%', '18%', 12, '⋆', 400],
  ['20%', '32%', 14, '✦', 600],
  ['88%', '28%', 18, '✧', 150],
  ['35%', '10%', 10, '⋆', 350],
  ['68%', '40%', 14, '✦', 500],
  ['12%', '55%', 18, '✧', 250],
  ['82%', '55%', 12, '⋆', 700],
  ['45%', '62%', 20, '✦', 100],
  ['25%', '72%', 14, '✧', 450],
  ['72%', '70%', 16, '⋆', 300],
];

function StarParticle({ left, top, size, symbol, delay }: {
  left: `${number}%`; top: `${number}%`; size: number; symbol: string; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left,
        top,
        fontSize: size,
        color: colors.luckyGold,
        opacity,
        transform: [{ scale }],
      }}
    >
      {symbol}
    </Animated.Text>
  );
}

function CalculationScreen() {
  const orbPulse = useRef(new Animated.Value(0.85)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const textFade = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(orbPulse, { toValue: 0.85, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(textFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(textFade, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.calculationScreen}>
      {/* Scattered star particles */}
      {STAR_PARTICLES.map(([left, top, size, symbol, delay], i) => (
        <StarParticle key={i} left={left} top={top} size={size} symbol={symbol} delay={delay} />
      ))}

      {/* Central orb */}
      <View style={styles.calcOrbWrap}>
        {/* Outer glow ring */}
        <Animated.View style={[styles.calcOrbGlow, { opacity: glowPulse, transform: [{ scale: glowPulse.interpolate({ inputRange: [0.4, 1], outputRange: [0.92, 1.12] }) }] }]} />
        {/* Inner orb */}
        <Animated.View style={[styles.calcOrb, { transform: [{ scale: orbPulse }] }]}>
          <Text style={styles.calcOrbStar}>✦</Text>
        </Animated.View>
      </View>

      <Animated.Text style={[styles.calculatingText, { opacity: textFade }]}>
        Aligning your stars...
      </Animated.Text>
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
            setTimeout(() => {
              if (active) {
                // Stars aligned — go straight to the full reading
                router.replace('/detail');
              }
            }, 1400); // Build anticipation during calculation
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  if (loading || !profile || !reading) {
    return <CalculationScreen />;
  }

  return (
    <Screen showTabBar>
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
            <Ionicons name="settings-outline" size={22} color={colors.mauve} />
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
          <Ionicons name="chevron-forward" size={20} color="#7B6CB8" style={{ opacity: 0.7 }} />
        </Pressable>
      ) : null}

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Today's lucky metrics</Text>
        <View style={styles.sectionLabelLine} />
      </View>

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

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Your zodiac signs</Text>
        <View style={styles.sectionLabelLine} />
      </View>

      <ChineseZodiacCard
        animal={reading.chineseZodiac}
        birthday={profile.birthday}
        westernSign={reading.westernZodiac || undefined}
        nickname={profile.nickname || undefined}
        insight={reading.zodiacInsight ?? undefined}
        westernInsight={reading.westernZodiacInsight || undefined}
      />

      {/* ── Moon phase — static display, content visible without navigation ── */}
      <View style={styles.moonStrip}>
        <Text style={styles.moonEmoji}>{getMoonEmoji(reading.moonPhase)}</Text>
        <View style={styles.moonCopy}>
          <View style={styles.moonPhaseLabelRow}>
            <Text style={styles.moonPhaseLabel}>🌙 {reading.moonPhase}</Text>
            {reading.lunarDate ? <Text style={styles.lunarDate}>{reading.lunarDate}</Text> : null}
          </View>
          <Text style={styles.moonPhaseMessage}>{reading.moonMessage}</Text>
        </View>
      </View>

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Almanac guidance</Text>
        <View style={styles.sectionLabelLine} />
      </View>

      {/* Almanac + Daily action share one gate — avoids two consecutive lock screens */}
      <PremiumGate isPremium={isPremium} featureLabel="the Chinese Almanac & daily action">
        <View style={styles.almanacActionGroup}>
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
          <Card style={styles.guidanceCard}>
            <SectionRow label="🍀 Small action" value={reading.action} />
          </Card>
        </View>
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

      {/* Premium teaser removed — PremiumGate locks + header Upgrade button handle conversion */}

      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>Your daily ritual</Text>
        <View style={styles.sectionLabelLine} />
      </View>

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
            <Text style={styles.streakValue}>Day 1 of your ritual ✨</Text>
            <Text style={styles.streakCopy}>You've begun. Come back tomorrow to grow your streak.</Text>
          </>
        ) : (
          <>
            <Text style={styles.streakValue}>{streak} {streak === 1 ? 'day' : 'days'} ✨</Text>
            {/* Progress bar toward next milestone */}
            <View style={styles.streakProgressTrack}>
              <View style={[styles.streakProgressFill, { width: `${getStreakProgressPercent(streak)}%` }]} />
            </View>
            <Text style={styles.streakCopy}>
              {streak === 1 ? 'Your ritual has begun. Come back tomorrow to grow it.' : getStreakCopy(streak)}
            </Text>
          </>
        )}
      </Card>

      {/* Nav grid removed — bottom tab bar now handles Today/History/Profile navigation */}
      {/* Rate-today link preserved as an inline card shortcut */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Rate today's reading"
        style={({ pressed }) => [styles.rateCard, pressed && styles.rateCardPressed]}
        onPress={() => { triggerLightHaptic(); router.push('/feedback'); }}
      >
        <Ionicons name="star-outline" size={20} color={colors.mauve} />
        <Text style={styles.rateLabel}>Rate today's reading</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.mauve} style={{ opacity: 0.6 }} />
      </Pressable>

      {/* ── Return-tomorrow hook ── */}
      <Card style={styles.tomorrowCard}>
        <Text style={styles.tomorrowEmoji}>🌙</Text>
        <View style={styles.tomorrowBody}>
          <Text style={styles.tomorrowTitle}>Your energy shifts tomorrow</Text>
          <Text style={styles.tomorrowCopy}>
            Come back in the morning to see if your luck rises. Every day is a new reading.
          </Text>
        </View>
      </Card>

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
  if (hour < 5) return { kicker: '🌙 LATE NIGHT', prefix: 'Still up,' };
  if (hour < 12) return { kicker: '🌅 MORNING', prefix: 'Good morning,' };
  if (hour < 17) return { kicker: '☀️ AFTERNOON', prefix: 'Good afternoon,' };
  if (hour < 20) return { kicker: '🌇 EVENING', prefix: 'Good evening,' };
  return { kicker: '🌙 LATE', prefix: 'Good evening,' };
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
  calculationScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  calcOrbWrap: {
    alignItems: 'center',
    height: 160,
    justifyContent: 'center',
    width: 160,
  },
  calcOrbGlow: {
    backgroundColor: 'rgba(214, 168, 74, 0.22)',
    borderColor: 'rgba(214, 168, 74, 0.35)',
    borderRadius: 90,
    borderWidth: 1.5,
    height: 160,
    position: 'absolute',
    width: 160,
    ...Platform.select({
      web: { boxShadow: '0 0 48px rgba(214, 168, 74, 0.45)' },
    }),
  },
  calcOrb: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 60,
    borderWidth: 2,
    height: 120,
    justifyContent: 'center',
    width: 120,
    ...Platform.select({
      web: { boxShadow: '0 0 28px rgba(214, 168, 74, 0.6)' },
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 20,
      },
    }),
  },
  calcOrbStar: {
    color: colors.goldDeep,
    fontSize: 48,
    fontWeight: '900',
  },
  calculatingText: {
    color: colors.mauve,
    fontFamily: fonts.heavy,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  kicker: {
    color: colors.mauve,
    fontFamily: fonts.heavy,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.heavy,
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
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 24,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    width: 48,
    ...Platform.select({
      web: { boxShadow: `0 4px 12px rgba(214, 168, 74, 0.25)` },
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
  },
  settingsText: {
    fontSize: 24,
    lineHeight: 28,
  },
  // Section labels
  sectionLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: -spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionLabelText: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionLabelLine: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1,
    opacity: 0.6,
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
  // Moon phase card — static, no navigation
  moonStrip: {
    alignItems: 'flex-start',
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
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 4,
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
    backgroundColor: colors.luckyGold,
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
  almanacActionGroup: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tomorrowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  tomorrowEmoji: {
    fontSize: 32,
  },
  tomorrowBody: {
    flex: 1,
    gap: 4,
  },
  tomorrowTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 15,
    fontWeight: '900',
  },
  tomorrowCopy: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  rateCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rateCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  rateLabel: {
    color: colors.mauve,
    flex: 1,
    fontFamily: fonts.heavy,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
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
