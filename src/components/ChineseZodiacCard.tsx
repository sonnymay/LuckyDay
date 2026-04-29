import { StyleSheet, Text, View } from 'react-native';
import { getChineseZodiacDetails } from '../lib/chineseZodiac';
import { colors, radii, spacing } from '../styles/theme';
import { Card } from './Card';

type Props = {
  animal: string;
  compact?: boolean;
};

export function ChineseZodiacCard({ animal, compact = false }: Props) {
  const details = getChineseZodiacDetails(animal);

  return (
    <Card style={[styles.card, compact && styles.compactCard]}>
      <View style={[styles.picture, compact && styles.compactPicture]}>
        <Text style={[styles.emoji, compact && styles.compactEmoji]}>{details.emoji}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>Chinese zodiac</Text>
        <Text style={[styles.animal, compact && styles.compactAnimal]}>{animal}</Text>
        <Text style={styles.tone}>{details.tone}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'row',
    gap: spacing.md,
  },
  compactCard: {
    padding: spacing.sm,
  },
  picture: {
    alignItems: 'center',
    backgroundColor: colors.blush,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  compactPicture: {
    height: 68,
    width: 68,
  },
  emoji: {
    fontSize: 52,
    lineHeight: 58,
  },
  compactEmoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  copy: {
    flex: 1,
  },
  label: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  animal: {
    color: colors.mauve,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },
  compactAnimal: {
    fontSize: 24,
  },
  tone: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
