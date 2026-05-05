import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

async function triggerLightHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import {
  getOfferings,
  getPremiumStatus,
  PurchasePackage,
  purchasePackage,
  restorePurchases,
} from '../src/lib/purchases';
import { generateDailyReading } from '../src/lib/luck';
import { getStoredProfile } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';

const FEATURES = [
  { emoji: '🎨', label: 'Lucky color, number, best time & compass direction — every day' },
  { emoji: '💰', label: 'Full money, love, work & health breakdowns — not just scores' },
  { emoji: '🌙', label: 'Lunar calendar dates and Chinese solar terms explained' },
  { emoji: '📖', label: 'Reading history to spot your personal luck patterns' },
  { emoji: '✨', label: 'Premium share cards that stop the scroll on IG & LINE' },
  { emoji: '🔥', label: 'Streak milestones and daily zodiac insight unlocked' },
];

const RITUAL_PREVIEW = [
  { emoji: '🌅', title: 'What to do today', copy: 'Your lucky color to wear, number to carry, best hour to act, and direction to face — all specific to you.' },
  { emoji: '💌', title: 'Share in one tap', copy: 'A beautiful card with your score, zodiac, color & number — sized perfectly for IG Stories or LINE.' },
  { emoji: '📅', title: 'Your luck over time', copy: 'See if your score trends up on certain days, which moon phases hit hardest, and what to expect ahead.' },
];

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
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 20, backgroundColor: colors.roseGold, opacity }, style]}
    />
  );
}

function PaywallSkeleton() {
  return (
    <View style={styles.skeletonScreen}>
      <SkeletonBlock width="100%" height={320} />
      <SkeletonBlock width="100%" height={100} style={{ borderRadius: 16 }} />
      <SkeletonBlock width="100%" height={180} style={{ borderRadius: 16 }} />
      <SkeletonBlock width="80%" height={56} style={{ borderRadius: 999 }} />
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [selected, setSelected] = useState<PurchasePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [todayScore, setTodayScore] = useState<number>(88);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // Load today's real score for the orb
    getStoredProfile()
      .then((profile) => {
        if (!mounted.current || !profile) return;
        const reading = generateDailyReading(profile);
        setTodayScore(reading.score);
      })
      .catch(() => undefined);

    getPremiumStatus()
      .then((status) => {
        if (!mounted.current) return;
        if (status.isPremium) {
          router.replace('/home');
          return;
        }
        return getOfferings();
      })
      .then((pkgs) => {
        if (!mounted.current || !pkgs) return;
        setPackages(pkgs);
        // Default: select annual (best value)
        const annual = pkgs.find((p) => p.productIdentifier.includes('annual'));
        setSelected(annual ?? pkgs[0] ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => {
      mounted.current = false;
    };
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!selected) return;
    setPurchasing(true);

    try {
      const result = await purchasePackage(selected);
      if (!mounted.current) return;

      if (result.success && result.isPremium) {
        router.replace('/home');
        return;
      }

      if (!result.success && !result.cancelled) {
        Alert.alert(
          'Something went wrong',
          result.error ?? 'Please try again or restore your purchase.',
        );
      }
    } finally {
      if (mounted.current) setPurchasing(false);
    }
  }, [selected]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const status = await restorePurchases();
      if (!mounted.current) return;
      if (status.isPremium) {
        router.replace('/home');
      } else {
        Alert.alert('No purchase found', 'Make sure you are signed into the same Apple ID.');
      }
    } finally {
      if (mounted.current) setRestoring(false);
    }
  }, []);

  if (loading) {
    return <PaywallSkeleton />;
  }

  const annualPkg = packages.find((p) => p.productIdentifier.includes('annual'));
  const monthlyPkg = packages.find((p) => p.productIdentifier.includes('monthly'));
  const showPackages = packages.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.aura1} pointerEvents="none" />
      <View style={styles.aura2} pointerEvents="none" />
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Close button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close paywall"
        onPress={() => router.replace('/home')}
        style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="close" size={22} color={colors.mauve} />
      </Pressable>

      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />
        <View style={styles.decorSparkleTop} pointerEvents="none">
          <Text style={styles.decorSparkleText}>✦</Text>
        </View>
        <View style={styles.decorSparkleBottom} pointerEvents="none">
          <Text style={styles.decorSparkleText}>✧</Text>
        </View>
        <Text style={styles.badge}>✨ LuckyDay Premium</Text>
        <View style={styles.heroOrb}>
          <Text style={styles.heroOrbStars}>✦ ✧ ✦</Text>
          <Text style={styles.heroOrbNumber}>{todayScore}</Text>
          <Text style={styles.heroOrbLabel}>TODAY'S ENERGY</Text>
        </View>
        <Text style={styles.headline}>Make every morning{'\n'}feel chosen</Text>
        <Text style={styles.subhead}>
          Unlock deeper readings, prettier share cards, and a luck history that starts to feel like
          your private oracle.
        </Text>
        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>Your personal oracle. Every morning.</Text>
        </View>
      </View>

      <View style={styles.previewStack}>
        {RITUAL_PREVIEW.map((item) => (
          <View key={item.title} style={styles.previewRow}>
            <Text style={styles.previewEmoji}>{item.emoji}</Text>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>{item.title}</Text>
              <Text style={styles.previewText}>{item.copy}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Value nudge — what changes today */}
      <Card style={styles.nudgeCard}>
        <Text style={styles.nudgeHeading}>What changes when you unlock</Text>
        <View style={styles.nudgeRow}>
          <Text style={styles.nudgeEmoji}>🔒</Text>
          <Text style={styles.nudgeFree}>Free: energy score · zodiac animals · basic reading summary</Text>
        </View>
        <Text style={styles.nudgeArrow}>↓</Text>
        <View style={styles.nudgeRow}>
          <Text style={styles.nudgeEmoji}>✨</Text>
          <Text style={styles.nudgePremium}>Premium: lucky color + number + time + direction · money/love/work/health detail · lunar almanac · reading history · richer share cards</Text>
        </View>
      </Card>

      {/* Feature list */}
      <Card style={styles.featuresCard}>
        <Text style={styles.featuresHeading}>Premium includes</Text>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </Card>

      {/* Pricing packages */}
      {showPackages ? (
        <View style={styles.packages}>
          {annualPkg ? (
            <Pressable
              style={[styles.packageCard, selected?.productIdentifier === annualPkg.productIdentifier && styles.packageSelected]}
              onPress={() => { triggerLightHaptic(); setSelected(annualPkg); }}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
              <Text style={styles.packageTitle}>Annual</Text>
              <Text style={styles.packagePrice}>{annualPkg.localizedPriceString}</Text>
              <Text style={styles.packageNote}>less than $1.25/month · cancel anytime</Text>
            </Pressable>
          ) : null}

          {monthlyPkg ? (
            <Pressable
              style={[styles.packageCard, selected?.productIdentifier === monthlyPkg.productIdentifier && styles.packageSelected]}
              onPress={() => { triggerLightHaptic(); setSelected(monthlyPkg); }}
            >
              <Text style={styles.packageTitle}>Monthly</Text>
              <Text style={styles.packagePrice}>{monthlyPkg.localizedPriceString}</Text>
              <Text style={styles.packageNote}>per month · cancel anytime</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        // Fallback pricing display when RevenueCat not configured
        <View style={styles.packages}>
          <View style={[styles.packageCard, styles.packageSelected]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
            <Text style={styles.packageTitle}>Annual</Text>
            <Text style={styles.packagePrice}>$29.99 / year</Text>
            <Text style={styles.packageNote}>less than $2.50 a month</Text>
          </View>
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>Monthly</Text>
            <Text style={styles.packagePrice}>$4.99 / month</Text>
            <Text style={styles.packageNote}>cancel anytime</Text>
          </View>
        </View>
      )}

      {/* CTA */}
      <AppButton
        label={purchasing ? 'Starting your trial...' : 'Try free for 3 days →'}
        onPress={handlePurchase}
        style={styles.cta}
      />

      {/* Free trial note */}
      <Text style={styles.trialNote}>
        3-day free trial · No charge until Day 4 · Cancel anytime
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={handleRestore} disabled={restoring}>
          <Text style={styles.footerLink}>{restoring ? 'Restoring...' : 'Restore purchase'}</Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => router.push('/privacy')}>
          <Text style={styles.footerLink}>Privacy</Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => router.replace('/home')}>
          <Text style={styles.footerLink}>Not now</Text>
        </Pressable>
      </View>

      <Text style={styles.legal}>
        Payment will be charged to your Apple ID. Subscription automatically renews unless cancelled
        at least 24 hours before the end of the current period.
      </Text>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  skeletonScreen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  aura1: {
    backgroundColor: 'rgba(192, 58, 120, 0.08)',
    borderRadius: 999,
    height: 340,
    position: 'absolute',
    right: -100,
    top: -100,
    width: 340,
  },
  aura2: {
    backgroundColor: 'rgba(237, 186, 64, 0.06)',
    borderRadius: 999,
    bottom: 80,
    height: 260,
    left: -80,
    position: 'absolute',
    width: 260,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 40,
    justifyContent: 'center',
    marginBottom: -spacing.sm,
    width: 40,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderRadius: radii.lg,
    gap: spacing.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    ...Platform.select({
      web: { boxShadow: `0 8px 24px rgba(192, 58, 120, 0.25)` },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
    }),
  },
  decorCircle1: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    height: 200,
    position: 'absolute',
    right: -60,
    top: -60,
    width: 200,
  },
  decorCircle2: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    bottom: -50,
    height: 140,
    left: -40,
    position: 'absolute',
    width: 140,
  },
  decorSparkleTop: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.xl,
  },
  decorSparkleBottom: {
    bottom: spacing.xl,
    position: 'absolute',
    right: spacing.lg,
  },
  decorSparkleText: {
    color: 'rgba(255, 240, 199, 0.7)',
    fontSize: 26,
    fontWeight: '900',
  },
  badge: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroOrb: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 86,
    borderWidth: 2,
    height: 152,
    justifyContent: 'center',
    width: 152,
    ...Platform.select({
      web: { boxShadow: `0 0 0 12px rgba(237, 186, 64, 0.16), 0 16px 40px rgba(45, 22, 53, 0.24)` },
      default: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
      },
    }),
  },
  heroOrbStars: {
    color: colors.luckyGold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 2,
  },
  heroOrbNumber: {
    color: colors.goldDeep,
    fontSize: 50,
    fontWeight: '900',
    lineHeight: 56,
  },
  heroOrbLabel: {
    color: colors.goldDeep,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headline: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    textAlign: 'center',
  },
  subhead: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  socialProof: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  socialProofStar: {
    color: colors.luckyGold,
    fontSize: 14,
    letterSpacing: 2,
  },
  socialProofText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewStack: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.md,
    ...Platform.select({
      web: { boxShadow: `0 8px 24px rgba(192, 58, 120, 0.10)` },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 22,
      },
    }),
  },
  previewRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  previewEmoji: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 20,
    height: 40,
    lineHeight: 38,
    overflow: 'hidden',
    textAlign: 'center',
    width: 40,
  },
  previewCopy: {
    flex: 1,
  },
  previewTitle: {
    color: colors.mauve,
    fontSize: 15,
    fontWeight: '900',
  },
  previewText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 2,
  },
  nudgeCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    gap: spacing.xs,
  },
  nudgeHeading: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  nudgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nudgeEmoji: {
    fontSize: 18,
    lineHeight: 24,
    width: 26,
  },
  nudgeFree: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  nudgePremium: {
    color: colors.mauve,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  nudgeArrow: {
    color: colors.roseGold,
    fontSize: 20,
    marginLeft: 6,
  },
  featuresCard: {
    backgroundColor: colors.panel,
    gap: spacing.sm,
  },
  featuresHeading: {
    color: colors.mauve,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureEmoji: {
    fontSize: 20,
    lineHeight: 26,
    width: 28,
  },
  featureLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  packages: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  packageCard: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.xs,
    overflow: 'hidden',
    padding: spacing.md,
    ...Platform.select({
      web: { boxShadow: `0 4px 12px rgba(192, 58, 120, 0.08)` },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  packageSelected: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.mauve,
    borderWidth: 2,
  },
  bestValueBadge: {
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  bestValueText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  packageTitle: {
    color: colors.mauve,
    fontSize: 16,
    fontWeight: '900',
  },
  packagePrice: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  packageNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.xs,
  },
  trialNote: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  footerLink: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '700',
  },
  footerDot: {
    color: colors.faint,
    fontSize: 14,
  },
  legal: {
    color: colors.faint,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
