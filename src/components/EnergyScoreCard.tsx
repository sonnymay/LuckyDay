import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, fonts, radii, spacing } from '../styles/theme';

type Props = {
  score: number;
  message: string;
};

const haloSegments = 28;
const haloRadius = 86;
const haloDotSize = 10;
const REVEAL_DURATION = 1200;

export function EnergyScoreCard({ score, message }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0.3)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const [filledSegments, setFilledSegments] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    setDisplayScore(0);
    setFilledSegments(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

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
      <Animated.Text style={[styles.sparkleOne, { opacity: sparkleAnim }]}>✦</Animated.Text>
      <Animated.Text style={[styles.sparkleTwo, { opacity: sparkleAnim }]}>✧</Animated.Text>
      <Animated.Text style={[styles.sparkleThree, { opacity: sparkleAnim }]}>✦</Animated.Text>
      <Animated.Text style={[styles.flower, { opacity: sparkleAnim }]}>❀</Animated.Text>
      <Animated.Text style={[styles.flowerTwo, { opacity: sparkleAnim }]}>✿</Animated.Text>
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
          <Text style={styles.scoreUnit}>/100</Text>
        </View>
      </View>
      <Text style={styles.moodPill}>{energyMood(displayScore)}</Text>
      <View style={styles.messagePanel}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Card>
  );
}

function energyMood(score: number) {
  if (score >= 90) return 'Peak energy today';
  if (score >= 82) return 'Golden flow';
  if (score >= 70) return 'Bright momentum';
  if (score >= 60) return 'Soft steady day';
  if (score >= 55) return 'Protect & prepare';
  return 'Rest to rise';
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
    ...Platform.select({
      web: {
        backgroundImage: `linear-gradient(145deg, ${colors.mauve} 0%, #A84878 100%)`,
      },
    }),
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
  sparkleThree: {
    color: 'rgba(255, 240, 199, 0.38)',
    fontSize: 14,
    fontWeight: '900',
    left: 56,
    position: 'absolute',
    top: 106,
  },
  flower: {
    bottom: 34,
    color: 'rgba(255, 240, 199, 0.34)',
    fontSize: 26,
    position: 'absolute',
    right: 42,
  },
  flowerTwo: {
    bottom: 44,
    color: 'rgba(255, 228, 240, 0.28)',
    fontSize: 20,
    position: 'absolute',
    left: 30,
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
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
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
        backgroundImage: `linear-gradient(135deg, #FFF0C7 0%, #FFD6E8 100%)`,
        boxShadow: `0 0 32px rgba(214, 168, 74, 0.6)`,
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
    fontFamily: fonts.heavy,
    fontSize: 72,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    color: colors.goldDeep,
    fontFamily: fonts.heavy,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    opacity: 0.7,
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
