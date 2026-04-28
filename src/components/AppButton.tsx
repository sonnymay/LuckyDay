import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
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
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.luckyGold,
    borderColor: colors.roseGold,
    borderWidth: 2,
    shadowColor: colors.luckyGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  secondary: {
    backgroundColor: colors.panelStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.line,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: colors.pink,
  },
  pressed: {
    opacity: 0.78,
  },
  label: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
});
