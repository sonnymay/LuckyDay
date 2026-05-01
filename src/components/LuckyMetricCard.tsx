import { Platform, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  note?: string;
  value: string;
  swatchColor?: string;
  variant?: 'default' | 'number' | 'direction';
};

export function LuckyMetricCard({ label, note, value, swatchColor, variant = 'default' }: Props) {
  const isNumber = variant === 'number';
  const isDirection = variant === 'direction';
  const isTime = label.includes('time') || label.includes('Time');

  return (
    <Card style={[styles.card, isNumber && styles.numberCard, isDirection && styles.directionCard]}>
      <Text style={styles.decor} pointerEvents="none">{isNumber ? '✦' : isDirection ? '⌁' : '✧'}</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.valueRow, isNumber && styles.centeredRow]}>
        {swatchColor ? (
          <View style={styles.swatchFrame}>
            <View style={[styles.swatch, { backgroundColor: swatchColor }]} />
          </View>
        ) : null}
        {isDirection ? (
          <View style={styles.directionBadge}>
            <Text style={styles.directionIcon}>{directionArrow(value)}</Text>
          </View>
        ) : null}
        <Text style={[styles.value, isNumber && styles.numberValue, isTime && styles.timeValue]}>{value}</Text>
      </View>
      {isNumber ? <Text style={styles.numberNote}>Lucky number</Text> : null}
      {isDirection ? <Text style={styles.miniNote}>Move with this direction today</Text> : null}
      {isTime ? <Text style={styles.miniNote}>Best window for lucky little moves</Text> : null}
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
    minHeight: 118,
    overflow: 'hidden',
  },
  numberCard: {
    backgroundColor: colors.champagne,
  },
  directionCard: {
    backgroundColor: '#FFF7E6',
  },
  decor: {
    color: 'rgba(214, 168, 74, 0.22)',
    fontSize: 44,
    fontWeight: '900',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.xs,
  },
  label: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  centeredRow: {
    justifyContent: 'center',
  },
  swatchFrame: {
    alignItems: 'center',
    backgroundColor: colors.blush,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
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
  directionBadge: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  directionIcon: {
    color: colors.goldDeep,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  value: {
    color: colors.ink,
    flex: 1,
    fontSize: 23,
    fontWeight: '900',
  },
  numberValue: {
    color: colors.goldDeep,
    flex: 0,
    fontSize: 62,
    lineHeight: 66,
    textAlign: 'center',
    textShadowColor: 'rgba(214, 168, 74, 0.18)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  timeValue: {
    fontSize: 21,
    lineHeight: 27,
  },
  numberNote: {
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  miniNote: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    marginTop: spacing.xs,
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
