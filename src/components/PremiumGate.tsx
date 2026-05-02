import { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radii, spacing } from '../styles/theme';

type Props = PropsWithChildren<{
  /** Whether the user has an active premium subscription. */
  isPremium: boolean;
  /** Short label shown on the lock overlay (e.g. "Lucky metrics"). */
  featureLabel?: string;
}>;

/**
 * Wraps premium-only content.
 * - If isPremium: renders children normally.
 * - If not: renders a blurred/locked overlay with a "Unlock" CTA.
 */
export function PremiumGate({ children, isPremium, featureLabel }: Props) {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Dim overlay — children render underneath but are obscured */}
      <View style={styles.dimContent} pointerEvents="none">
        {children}
      </View>

      {/* Lock overlay */}
      <View style={styles.overlay}>
        <View style={styles.lockCard}>
          <Text style={styles.lockEmoji}>✨</Text>
          <Text style={styles.lockTitle}>
            {featureLabel ? `Unlock ${featureLabel}` : 'Unlock Premium'}
          </Text>
          <Text style={styles.lockBody}>
            Full daily ritual · Chinese Almanac · Lucky metrics · Reading history
          </Text>
          <Pressable
            style={({ pressed }) => [styles.unlockButton, pressed && styles.unlockPressed]}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.unlockLabel}>Start free trial →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dimContent: {
    opacity: 0.15,
  },
  overlay: {
    ...Platform.select({
      web: { backdropFilter: 'blur(6px)' },
    }),
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lockCard: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.lg,
    ...Platform.select({
      web: { boxShadow: `0 8px 24px rgba(192, 58, 120, 0.16)` },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
    }),
    width: '90%',
  },
  lockEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  lockTitle: {
    color: colors.mauve,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  lockBody: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  unlockPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  unlockLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
