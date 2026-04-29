import { Platform, StyleSheet, Text, View } from 'react-native';
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

export function EnergyScoreCard({ label, score, message }: Props) {
  const filledSegments = Math.round((Math.max(0, Math.min(score, 100)) / 100) * haloSegments);

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.orb}>
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
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.scoreUnit}>luck energy</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    borderWidth: 2,
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  label: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  message: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
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
});
