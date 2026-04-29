import { Platform, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, spacing } from '../styles/theme';

type Props = {
  label: string;
  note?: string;
  value: string;
  swatchColor?: string;
  variant?: 'default' | 'number' | 'direction';
};

export function LuckyMetricCard({ label, note, value, swatchColor, variant = 'default' }: Props) {
  return (
    <Card style={[styles.card, variant === 'number' && styles.numberCard]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {swatchColor ? <View style={[styles.swatch, { backgroundColor: swatchColor }]} /> : null}
        {variant === 'direction' ? <Text style={styles.directionIcon}>{directionArrow(value)}</Text> : null}
        <Text style={[styles.value, variant === 'number' && styles.numberValue]}>{value}</Text>
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </Card>
  );
}

function directionArrow(value: string) {
  const arrows: Record<string, string> = {
    East: '→',
    North: '↑',
    Northeast: '↗',
    Northwest: '↖',
    South: '↓',
    Southeast: '↘',
    Southwest: '↙',
    West: '←',
  };

  return arrows[value] ?? '↗';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.sunrise,
    borderColor: colors.roseGold,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
  },
  numberCard: {
    backgroundColor: colors.champagne,
  },
  label: {
    color: colors.mauve,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  swatch: {
    borderColor: colors.luckyGold,
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    ...Platform.select({
      web: {
        boxShadow: `0 0 8px rgba(214, 168, 74, 0.3)`,
      },
      default: {
        shadowColor: colors.luckyGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
    width: 44,
  },
  directionIcon: {
    color: colors.goldDeep,
    fontSize: 36,
    fontWeight: '900',
    width: 40,
  },
  value: {
    color: colors.ink,
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
  },
  numberValue: {
    color: colors.goldDeep,
    fontSize: 56,
    lineHeight: 62,
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
