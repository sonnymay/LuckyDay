import { StyleSheet, Text, View } from 'react-native';
import { elementEmoji, getChineseZodiacDetails, getZodiacElement } from '../lib/chineseZodiac';
import { colors, radii, spacing } from '../styles/theme';
import { Card } from './Card';

const elementColor: Record<string, string> = {
  Water: colors.blue,
  Earth: colors.goldDeep,
  Wood: colors.jade,
  Fire: colors.luckyRed,
  Metal: colors.muted,
};

type Props = {
  animal: string;
  birthday?: string;
  westernSign?: string;
  /** User nickname for personalizing the header label. */
  nickname?: string;
  /** Seed-personalized daily insight from Chinese zodiac animal. */
  insight?: string;
  /** Seed-personalized daily insight from Western zodiac sign. */
  westernInsight?: string;
  compact?: boolean;
};

export function ChineseZodiacCard({ animal, birthday, westernSign, nickname, insight, westernInsight, compact = false }: Props) {
  const details = getChineseZodiacDetails(animal);
  const element = getZodiacElement(animal, birthday);

  function getLabel(): string {
    if (nickname) {
      return westernSign ? `${nickname}'s zodiac signs` : `${nickname}'s zodiac`;
    }
    return westernSign ? 'East · West zodiac' : 'Chinese zodiac';
  }

  return (
    <Card style={[styles.card, compact && styles.compactCard]}>
      <View style={[styles.picture, compact && styles.compactPicture]}>
        <Text style={[styles.emoji, compact && styles.compactEmoji]}>{details.emoji}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{getLabel()}</Text>
        <Text style={[styles.animal, compact && styles.compactAnimal]}>
          {westernSign ? `${animal} · ${westernSign}` : animal}
        </Text>
        <Text style={styles.tone}>{details.tone}</Text>
        {element ? (
          <Text style={[styles.elementBadge, { color: elementColor[element] ?? colors.muted }]}>
            {elementEmoji[element]} {element} Element
          </Text>
        ) : null}
        {insight ? <Text style={styles.insight}>{insight}</Text> : null}
        {westernInsight ? <Text style={styles.westernInsight}>{westernInsight}</Text> : null}
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
  insight: {
    color: colors.goldDeep,
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  westernInsight: {
    color: '#5A47B0',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  elementBadge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
});
