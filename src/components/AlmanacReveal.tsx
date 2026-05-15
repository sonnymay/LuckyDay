import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, fonts, spacing } from '../styles/theme';

type Props = {
  onDone: () => void;
};

const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
const elementGlyphs = ['🌿', '🔥', '⛰️', '⚜️', '💧'];
const ringRadius = 110;

const REVEAL_TOTAL_MS = 1500;

export function AlmanacReveal({ onDone }: Props) {
  const reduceMotion = useReducedMotion();

  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      // Snap visible, hold one tick so the user perceives the transition
      // rather than a jarring jump cut, then hand off.
      sparkleAnim.setValue(1);
      ringAnim.setValue(1);
      orbAnim.setValue(1);
      titleAnim.setValue(1);
      const id = setTimeout(onDone, 250);
      return () => clearTimeout(id);
    }

    Animated.sequence([
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const id = setTimeout(onDone, REVEAL_TOTAL_MS);
    return () => clearTimeout(id);
  }, [reduceMotion, onDone, sparkleAnim, ringAnim, orbAnim, titleAnim]);

  const orbScale = orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const titleTranslate = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Consulting the almanac"
      style={styles.overlay}
      pointerEvents="auto"
    >
      <Animated.Text style={[styles.sparkleA, { opacity: sparkleAnim }]}>✦</Animated.Text>
      <Animated.Text style={[styles.sparkleB, { opacity: sparkleAnim }]}>✧</Animated.Text>
      <Animated.Text style={[styles.sparkleC, { opacity: sparkleAnim }]}>✦</Animated.Text>
      <Animated.Text style={[styles.sparkleD, { opacity: sparkleAnim }]}>✧</Animated.Text>

      <View style={styles.ring}>
        {elements.map((label, index) => {
          const angle = (index / elements.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * ringRadius;
          const y = Math.sin(angle) * ringRadius;
          return (
            <Animated.View
              key={label}
              style={[
                styles.elementDot,
                {
                  opacity: ringAnim,
                  transform: [{ translateX: x }, { translateY: y }, { scale: ringAnim }],
                },
              ]}
            >
              <Text style={styles.elementGlyph}>{elementGlyphs[index]}</Text>
              <Text style={styles.elementLabel}>{label}</Text>
            </Animated.View>
          );
        })}

        <Animated.View
          style={[
            styles.orb,
            { opacity: orbAnim, transform: [{ scale: orbScale }] },
          ]}
        >
          <Text style={styles.orbGlyph}>🍀</Text>
        </Animated.View>
      </View>

      <Animated.Text
        style={[
          styles.title,
          { opacity: titleAnim, transform: [{ translateY: titleTranslate }] },
        ]}
      >
        Consulting the almanac…
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
    zIndex: 100,
  },
  ring: {
    alignItems: 'center',
    height: 260,
    justifyContent: 'center',
    width: 260,
  },
  elementDot: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.roseGold,
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    position: 'absolute',
    width: 64,
  },
  elementGlyph: {
    fontSize: 22,
  },
  elementLabel: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  orb: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 60,
    borderWidth: 2,
    height: 120,
    justifyContent: 'center',
    shadowColor: colors.luckyGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    width: 120,
  },
  orbGlyph: {
    fontSize: 56,
  },
  title: {
    color: colors.mauve,
    fontFamily: fonts.heavy,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  sparkleA: {
    color: colors.luckyGold,
    fontSize: 22,
    left: '18%',
    position: 'absolute',
    top: '22%',
  },
  sparkleB: {
    color: colors.roseGold,
    fontSize: 18,
    position: 'absolute',
    right: '20%',
    top: '28%',
  },
  sparkleC: {
    color: colors.luckyGold,
    fontSize: 16,
    bottom: '28%',
    left: '24%',
    position: 'absolute',
  },
  sparkleD: {
    bottom: '24%',
    color: colors.roseGold,
    fontSize: 20,
    position: 'absolute',
    right: '18%',
  },
});
