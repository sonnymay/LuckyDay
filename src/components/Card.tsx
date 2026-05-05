import { PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {/* Subtle top-edge highlight for depth */}
      <View style={styles.topHighlight} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: spacing.md,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 8px rgba(192, 58, 120, 0.06), 0 12px 32px rgba(192, 58, 120, 0.14)`,
      },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 28,
        elevation: 6,
      },
    }),
  },
  topHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 1,
    height: 1,
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: 0,
  },
});
