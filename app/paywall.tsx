import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
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
  { emoji: '📋', label: 'Deeper money, love, work & health readings' },
  { emoji: '📖', label: 'Longer reading history and patterns' },
  { emoji: '✨', label: 'Premium share-card styles' },
  { emoji: '🔮', label: 'Future photo insight rituals' },
  { emoji: '🌸', label: 'Seasonal luck themes and guidance' },
  { emoji: '🔥', label: 'Extra streak celebrations' },
];

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [selected, setSelected] = useState<PurchasePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

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
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.mauve} size="large" />
      </View>
    );
  }

  const annualPkg = packages.find((p) => p.productIdentifier.includes('annual'));
  const monthlyPkg = packages.find((p) => p.productIdentifier.includes('monthly'));
  const showPackages = packages.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />
        <Text style={styles.badge}>✨ LuckyDay Premium</Text>
        <Text style={styles.headline}>Your full daily{'\n'}luck ritual</Text>
        <Text style={styles.subhead}>
          Real Chinese almanac guidance, personalized lucky metrics, and daily rituals — every
          morning.
        </Text>
        <View style={styles.socialProof}>
          <Text style={styles.socialProofStar}>★★★★★</Text>
          <Text style={styles.socialProofText}>Trusted by thousands of daily practitioners</Text>
        </View>
      </View>

      {/* Value nudge — what changes today */}
      <Card style={styles.nudgeCard}>
        <Text style={styles.nudgeHeading}>What changes when you unlock</Text>
        <View style={styles.nudgeRow}>
          <Text style={styles.nudgeEmoji}>🔒</Text>
          <Text style={styles.nudgeFree}>Free: daily score · metrics · almanac · share card</Text>
        </View>
        <Text style={styles.nudgeArrow}>↓</Text>
        <View style={styles.nudgeRow}>
          <Text style={styles.nudgeEmoji}>✨</Text>
          <Text style={styles.nudgePremium}>Premium: deeper readings · longer history · future photo insights</Text>
        </View>
      </Card>

      {/* Feature list */}
      <Card style={styles.featuresCard}>
        <Text style={styles.featuresHeading}>Everything unlocked</Text>
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
              onPress={() => setSelected(annualPkg)}
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
              onPress={() => setSelected(monthlyPkg)}
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
            <Text style={styles.packagePrice}>$14.99 / year</Text>
            <Text style={styles.packageNote}>less than $1.25 a month</Text>
          </View>
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>Monthly</Text>
            <Text style={styles.packagePrice}>$2.99 / month</Text>
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
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderRadius: radii.lg,
    gap: spacing.sm,
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
  badge: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headline: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
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
