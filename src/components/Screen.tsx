import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './TabBar';
import { colors, spacing } from '../styles/theme';

type Props = PropsWithChildren<{
  contentStyle?: ViewStyle;
  /** Show the persistent bottom tab bar (Today / History / Profile). */
  showTabBar?: boolean;
}>;

export function Screen({ children, contentStyle, showTabBar }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const translateY1 = scrollY.interpolate({ inputRange: [0, 1000], outputRange: [0, -150] });
  const translateY2 = scrollY.interpolate({ inputRange: [0, 1000], outputRange: [0, -60] });
  const translateY3 = scrollY.interpolate({ inputRange: [0, 1000], outputRange: [0, -250] });

  return (
    // When tab bar is visible, exclude bottom safe area — TabBar handles it via useSafeAreaInsets
    <SafeAreaView style={styles.safe} edges={showTabBar ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>
      {/* Fixed soft aura — renders behind content, moves slowly with parallax */}
      <Animated.View style={[styles.aura1, { transform: [{ scale: pulseAnim }, { translateY: translateY1 }] }]} pointerEvents="none" />
      <Animated.View style={[styles.aura2, { transform: [{ scale: pulseAnim }, { translateY: translateY2 }] }]} pointerEvents="none" />
      <Animated.View style={[styles.aura3, { transform: [{ scale: pulseAnim }, { translateY: translateY3 }] }]} pointerEvents="none" />
      <Animated.ScrollView
        contentContainerStyle={[styles.content, showTabBar && styles.contentWithTabBar, contentStyle]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {children}
      </Animated.ScrollView>
      {showTabBar ? <TabBar /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl2,
  },
  // Extra bottom padding so last card isn't hidden behind the tab bar
  contentWithTabBar: {
    paddingBottom: 100,
  },
  // Decorative aura circles — absolute, non-interactive, paint behind ScrollView
  aura1: {
    backgroundColor: 'rgba(255, 214, 236, 0.65)',
    borderRadius: 999,
    height: 400,
    pointerEvents: 'none',
    position: 'absolute',
    right: -100,
    top: -100,
    width: 400,
    ...Platform.select({
      web: { backgroundImage: 'radial-gradient(circle, rgba(255, 214, 236, 0.8) 0%, rgba(255, 214, 236, 0) 70%)' }
    }),
  },
  aura2: {
    backgroundColor: 'rgba(255, 240, 199, 0.75)',
    borderRadius: 999,
    bottom: 80,
    height: 350,
    left: -120,
    pointerEvents: 'none',
    position: 'absolute',
    width: 350,
    ...Platform.select({
      web: { backgroundImage: 'radial-gradient(circle, rgba(255, 240, 199, 0.8) 0%, rgba(255, 240, 199, 0) 70%)' }
    }),
  },
  aura3: {
    backgroundColor: 'rgba(237, 232, 255, 0.85)',
    borderRadius: 999,
    bottom: 200,
    height: 300,
    pointerEvents: 'none',
    position: 'absolute',
    right: -50,
    width: 300,
    ...Platform.select({
      web: { backgroundImage: 'radial-gradient(circle, rgba(237, 232, 255, 0.9) 0%, rgba(237, 232, 255, 0) 70%)' }
    }),
  },
});
