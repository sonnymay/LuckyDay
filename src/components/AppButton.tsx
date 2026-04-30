import { Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
};

export function AppButton({ label, onPress, variant = 'primary', style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.luckyGold,
    borderColor: colors.roseGold,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: `0 8px 18px rgba(214, 168, 74, 0.32)`,
      },
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 18,
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
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
});
