import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
};

// Lazy haptic helper — silently no-ops on web or if expo-haptics isn't installed
async function triggerHaptic(variant: Props['variant']) {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    if (variant === 'danger') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (variant === 'primary') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // expo-haptics not installed or not supported — no-op
  }
}

export function AppButton({ label, onPress, variant = 'primary', style }: Props) {
  function handlePress() {
    triggerHaptic(variant);
    onPress();
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && (variant === 'primary' ? styles.pressedPrimary : styles.pressed),
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {variant === 'primary' ? (
            <View style={[styles.primaryShine, pressed && styles.primaryShinePressed]} pointerEvents="none" />
          ) : null}
          <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : variant === 'danger' ? styles.dangerLabel : styles.defaultLabel]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 60,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.mauve,
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        backgroundImage: `linear-gradient(135deg, ${colors.mauve} 0%, #B85B88 100%)`,
        boxShadow: `0 4px 8px rgba(192, 58, 120, 0.2), 0 10px 24px rgba(192, 58, 120, 0.3)`,
      },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.36,
        shadowRadius: 22,
        elevation: 8,
      },
    }),
  },
  secondary: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.line,
    borderWidth: 1.5,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.line,
    borderWidth: 1.5,
  },
  danger: {
    backgroundColor: colors.pink,
    borderColor: colors.roseGold,
    borderWidth: 1.5,
  },
  pressedPrimary: {
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  // Shine overlay inside primary button
  primaryShine: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    height: 36,
    left: 20,
    position: 'absolute',
    top: -8,
    width: '55%',
  },
  primaryShinePressed: {
    opacity: 0,
  },
  label: {
    fontFamily: fonts.heavy,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  primaryLabel: {
    color: colors.white,
  },
  defaultLabel: {
    color: colors.ink,
  },
  dangerLabel: {
    color: colors.red,
  },
});
