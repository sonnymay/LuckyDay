import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
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
import { colors, radii, spacing } from '../src/styles/theme';

const FEATURES = [
  { emoji: '🎨', label: 'Lucky color, number, best time, and direction for today' },
  { emoji: '💰', label: 'Money, love, work, and health guidance in plain language' },
  { emoji: '🌙', label: 'Lunar almanac, moon phase, and solar term context' },
  { emoji: '📖', label: 'Reading history to spot your personal luck patterns' },
  { emoji: '✨', label: 'Share cards made for IG Stories and LINE' },
];

function getBillingLabel(pkg: PurchasePackage | null) {
  if (!pkg) return '';
  if (pkg.productIdentifier.includes('annual')) return '/year';
  if (pkg.productIdentifier.includes('monthly')) return '/month';
  return '';
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [selected, setSelected] = useState<PurchasePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const mounted = useRef(true);

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const pkgs = await getOfferings();
      if (!mounted.current) return;
      setPackages(pkgs);
      const annual = pkgs.find((p) => p.productIdentifier.includes('annual'));
      setSelected(annual ?? pkgs[0] ?? null);
    } finally {
      if (mounted.current) setLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    getPremiumStatus()
      .then((status) => {
        if (!mounted.current) return;
        if (status.isPremium) {
          router.replace('/home');
          return;
        }
        return loadPackages();
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => {
      mounted.current = false;
    };
  }, [loadPackages]);

  const handlePurchase = useCallback(async () => {
    if (!selected) {
      await loadPackages();
      return;
    }

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
  }, [loadPackages, selected]);

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

  const annualPkg = packages.find((p) => p.productIdentifier.includes('annual'));
  const monthlyPkg = packages.find((p) => p.productIdentifier.includes('monthly'));
  const showPackages = packages.length > 0;
  const canPurchase = Boolean(selected);
  const pricingLoading = loading || loadingPackages;
  const pricingFailed = !pricingLoading && !showPackages;
  const priceSummary = pricingLoading
    ? 'Loading App Store pricing...'
    : annualPkg && monthlyPkg
      ? `${annualPkg.localizedPriceString}/year or ${monthlyPkg.localizedPriceString}/month`
      : selected?.localizedPriceString
        ? `${selected.localizedPriceString}${getBillingLabel(selected)}`
        : 'Pricing loads securely from the App Store';
  const selectedPrice = selected?.localizedPriceString ?? '';
  const ctaLabel = purchasing
    ? 'Starting Premium...'
    : pricingLoading
      ? 'Loading App Store pricing...'
      : canPurchase
        ? `Unlock Premium — ${selectedPrice}${getBillingLabel(selected)}`
        : 'Retry pricing';

  const handlePrimaryAction = () => {
    if (pricingLoading || purchasing) return;
    if (canPurchase) {
      handlePurchase();
      return;
    }
    loadPackages();
  };

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
        <View style={styles.lockedPreview}>
          <View style={styles.lockedTopRow}>
            <Text style={styles.lockedPill}>Premium reading</Text>
            <Ionicons name="lock-closed" size={16} color={colors.goldDeep} />
          </View>
          <Text style={styles.lockedTitle}>Unlock to see today's full premium guidance.</Text>
          <View style={styles.lockedMetricRow}>
            <View style={styles.lockedMetric}>
              <Ionicons name="time-outline" size={16} color={colors.mauve} />
              <Text style={styles.lockedMetricLabel}>Best time</Text>
            </View>
            <View style={styles.lockedMetric}>
              <Ionicons name="color-palette-outline" size={16} color={colors.mauve} />
              <Text style={styles.lockedMetricLabel}>Lucky color</Text>
            </View>
            <View style={styles.lockedMetric}>
              <Ionicons name="compass-outline" size={16} color={colors.mauve} />
              <Text style={styles.lockedMetricLabel}>Direction</Text>
            </View>
          </View>
          <View style={styles.lockedOverlay}>
            <Ionicons name="lock-closed" size={18} color={colors.white} />
            <Text style={styles.lockedOverlayText}>Premium locked</Text>
          </View>
        </View>
        <Text style={styles.headline}>Make every morning{'\n'}feel chosen</Text>
        <Text style={styles.priceHero}>{priceSummary}</Text>
        {pricingLoading ? (
          <View style={styles.pricingLoadingRow}>
            <ActivityIndicator color={colors.champagne} />
            <Text style={styles.pricingLoadingText}>Checking secure App Store pricing</Text>
          </View>
        ) : null}
        <Text style={styles.subhead}>
          Unlock deeper readings, prettier share cards, and a luck history that helps you spot your patterns.
        </Text>
        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>Private by design · restore purchases anytime</Text>
        </View>
      </View>

      {/* Value nudge — what changes today */}
      <Card style={styles.nudgeCard}>
        <Text style={styles.nudgeHeading}>What changes when you unlock</Text>
        <View style={styles.compareGrid}>
          <View style={styles.compareColumn}>
            <Text style={styles.compareLabel}>Free</Text>
            <Text style={styles.compareText}>Daily score, zodiac animals, and a simple reading summary.</Text>
          </View>
          <View style={[styles.compareColumn, styles.comparePremium]}>
            <Text style={styles.compareLabelPremium}>Premium</Text>
            <Text style={styles.compareTextPremium}>Best time, color, direction, almanac context, history, and share cards.</Text>
          </View>
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
              <Text style={styles.packageNote}>best yearly value · cancel anytime</Text>
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
      ) : pricingFailed ? (
        <Card style={styles.purchaseUnavailableCard}>
          <Text style={styles.purchaseUnavailableCopy}>
            We couldn't load App Store pricing. Please check your connection and try again.
          </Text>
        </Card>
      ) : null}

      {!showPackages && pricingLoading ? (
        <Card style={styles.pricingPendingCard}>
          <ActivityIndicator color={colors.mauve} />
          <Text style={styles.pricingPendingText}>Loading App Store pricing...</Text>
        </Card>
      ) : null}

      {/* CTA */}
      <AppButton
        label={ctaLabel}
        onPress={handlePrimaryAction}
        style={styles.cta}
      />

      {/* Subscription disclosure — only visible once a package price has loaded */}
      {canPurchase ? (
        <Text style={styles.trialNote}>
          Subscription renews automatically · Cancel anytime in your Apple ID settings
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={handleRestore} disabled={restoring}>
          <Text style={styles.footerLink}>{restoring ? 'Restoring...' : 'Restore Purchases'}</Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => router.push('/privacy')}>
          <Text style={styles.footerLink}>Privacy</Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => router.push('/terms')}>
          <Text style={styles.footerLink}>Terms</Text>
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
  lockedPreview: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.lg,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
    width: '100%',
    ...Platform.select({
      web: { boxShadow: `0 12px 32px rgba(45, 22, 53, 0.18)` },
      default: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 22,
      },
    }),
  },
  lockedTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  lockedPill: {
    backgroundColor: colors.white,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  lockedTitle: {
    color: colors.goldDeep,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
    textAlign: 'center',
  },
  lockedMetricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  lockedMetric: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: 'rgba(192, 58, 120, 0.18)',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 58,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  lockedMetricLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  lockedOverlay: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  lockedOverlayText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
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
  priceHero: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.champagne,
    fontSize: 15,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  pricingLoadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pricingLoadingText: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '800',
  },
  socialProof: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  socialProofText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
  compareGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  compareColumn: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  comparePremium: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
  },
  compareLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  compareLabelPremium: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  compareText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  compareTextPremium: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
  purchaseUnavailableCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    gap: spacing.xs,
  },
  purchaseUnavailableCopy: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  pricingPendingCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  pricingPendingText: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '900',
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
