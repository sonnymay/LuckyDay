import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  score: number;
  message: string;
};

const haloSegments = 28;
const haloRadius = 86;
const haloDotSize = 10;
const REVEAL_DURATION = 1200;

export function EnergyScoreCard({ label, score, message }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const [filledSegments, setFilledSegments] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    setDisplayScore(0);
    setFilledSegments(0);

    Animated.timing(progress, {
      toValue: score,
      duration: REVEAL_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = progress.addListener(({ value }) => {
      const rounded = Math.round(value);
      setDisplayScore(rounded);
      setFilledSegments(Math.round((Math.max(0, Math.min(rounded, 100)) / 100) * haloSegments));
    });

    return () => {
      progress.removeListener(listener);
    };
  }, [score]);

  return (
    <Card style={styles.card}>
      {/* Decorative background circles for depth without a gradient package */}
      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={styles.decorCircle2} pointerEvents="none" />
      <Text style={styles.sparkleOne}>✦</Text>
      <Text style={styles.sparkleTwo}>✧</Text>
      <Text style={styles.flower}>❀</Text>
      <View style={styles.labelPill}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.messagePanel}>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.orb}>
        <View style={styles.orbGlow} pointerEvents="none" />
        {Array.from({ length: haloSegments }).map((_, index) => {
          const angle = (index / haloSegments) * Math.PI * 2 - Math.PI / 2;
          const isFilled = index < filledSegments;

          return (
            <View
              key={index}
              style={[
                styles.haloDot,
                {
                  backgroundColor: isFilled ? colors.luckyGold : colors.blush,
                  left: haloRadius + Math.cos(angle) * 76 - haloDotSize / 2,
                  opacity: isFilled ? 1 : 0.12,
                  top: haloRadius + Math.sin(angle) * 76 - haloDotSize / 2,
                },
              ]}
            />
          );
        })}
        <View style={styles.orbInner}>
          <Text style={styles.score}>{displayScore}</Text>
          <Text style={styles.scoreUnit}>luck energy</Text>
        </View>
      </View>
      <Text style={styles.moodPill}>{energyMood(displayScore)}</Text>
    </Card>
  );
}

function energyMood(score: number) {
  if (score >= 90) return '✦ Peak energy today';
  if (score >= 82) return 'Golden flow';
  if (score >= 70) return 'Bright momentum';
  if (score >= 60) return 'Soft steady luck';
  return 'Gentle reset energy';
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    borderWidth: 2,
    gap: spacing.md,
    overflow: 'hidden',
    paddingVertical: spacing.lg,
  },
  decorCircle1: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 999,
    height: 180,
    position: 'absolute',
    right: -50,
    top: -50,
    width: 180,
  },
  decorCircle2: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 999,
    bottom: -40,
    height: 120,
    left: -30,
    position: 'absolute',
    width: 120,
  },
  sparkleOne: {
    color: 'rgba(255, 240, 199, 0.56)',
    fontSize: 22,
    fontWeight: '900',
    left: 34,
    position: 'absolute',
    top: 36,
  },
  sparkleTwo: {
    color: 'rgba(255, 228, 240, 0.72)',
    fontSize: 18,
    fontWeight: '900',
    position: 'absolute',
    right: 42,
    top: 126,
  },
  flower: {
    bottom: 34,
    color: 'rgba(255, 240, 199, 0.34)',
    fontSize: 26,
    position: 'absolute',
    right: 42,
  },
  labelPill: {
    backgroundColor: 'rgba(255, 240, 199, 0.15)',
    borderColor: 'rgba(255, 240, 199, 0.32)',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  messagePanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 240, 199, 0.18)',
    borderRadius: radii.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  orb: {
    alignItems: 'center',
    backgroundColor: colors.blush,
    borderColor: colors.luckyGold,
    borderRadius: haloRadius,
    borderWidth: 2,
    height: 172,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: `0 0 22px rgba(214, 168, 74, 0.45)`,
      },
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 22,
      },
    }),
    width: 172,
  },
  orbGlow: {
    backgroundColor: 'rgba(255, 240, 199, 0.22)',
    borderRadius: 96,
    height: 192,
    position: 'absolute',
    width: 192,
  },
  haloDot: {
    borderRadius: haloDotSize / 2,
    height: haloDotSize,
    position: 'absolute',
    width: haloDotSize,
  },
  orbInner: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderRadius: radii.pill,
    height: 132,
    justifyContent: 'center',
    width: 132,
  },
  score: {
    color: colors.goldDeep,
    fontSize: 56,
    fontWeight: '900',
  },
  scoreUnit: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  moodPill: {
    backgroundColor: 'rgba(255, 240, 199, 0.16)',
    borderColor: 'rgba(255, 240, 199, 0.34)',
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
});
