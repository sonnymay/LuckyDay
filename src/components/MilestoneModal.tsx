import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, fonts, radii, spacing } from '../styles/theme';
import { Milestone } from '../lib/milestones';

interface Props {
  milestone: Milestone | null;
  onDismiss: () => void;
}

/**
 * Single-shot celebration modal for streak milestones (3/7/14/30/60/100/365 days).
 *
 * Parent passes `milestone = null` when there is nothing to show; the Modal stays
 * unmounted. Sparkle animation fades in over ~600ms; user dismisses with the
 * single primary button. Persistence (so it appears once) is handled by the
 * caller via storage.markMilestoneSeen.
 */
export function MilestoneModal({ milestone, onDismiss }: Props) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!milestone) return;
    if (reduceMotion) {
      // Skip entrance animation when Reduce Motion is on — show full sparkles
      // and the card at final size immediately.
      sparkleAnim.setValue(1);
      scaleAnim.setValue(1);
      return;
    }
    sparkleAnim.setValue(0);
    scaleAnim.setValue(0.9);
    Animated.parallel([
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [milestone, sparkleAnim, scaleAnim, reduceMotion]);

  if (!milestone) return null;

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.Text style={[styles.sparkleTop, { opacity: sparkleAnim }]}>✦</Animated.Text>
          <Animated.Text style={[styles.sparkleLeft, { opacity: sparkleAnim }]}>✧</Animated.Text>
          <Animated.Text style={[styles.sparkleRight, { opacity: sparkleAnim }]}>✦</Animated.Text>

          <Text style={styles.dayCount}>{milestone.days}</Text>
          <Text style={styles.dayLabel}>{milestone.days === 1 ? 'day' : 'days'}</Text>

          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.body}>{milestone.body}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onDismiss}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(45, 22, 53, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 2,
    maxWidth: 360,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '100%',
  },
  sparkleTop: {
    color: colors.luckyGold,
    fontSize: 24,
    position: 'absolute',
    right: 24,
    top: 16,
  },
  sparkleLeft: {
    color: colors.roseGold,
    fontSize: 18,
    left: 24,
    position: 'absolute',
    top: 36,
  },
  sparkleRight: {
    bottom: 28,
    color: colors.luckyGold,
    fontSize: 16,
    position: 'absolute',
    right: 32,
  },
  dayCount: {
    color: colors.mauve,
    fontFamily: fonts.heavy,
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 70,
  },
  dayLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
