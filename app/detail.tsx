import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getStoredProfile } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { DailyReading } from '../src/types';

export default function DetailScreen() {
  const [reading, setReading] = useState<DailyReading | null>(null);

  useFocusEffect(
    useCallback(() => {
      getStoredProfile().then((profile) => {
        if (!profile) {
          router.replace('/');
          return;
        }

        setReading(generateDailyReading(profile));
      });
    }, []),
  );

  if (!reading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Screen>
      <Card style={styles.top}>
        <Text style={styles.date}>✨ {reading.date}</Text>
        <Text style={styles.title}>{reading.mainMessage}</Text>
      </Card>

      {/* Daily fortune quote */}
      <Card style={styles.quoteCard}>
        <Text style={styles.quoteDecor}>❝</Text>
        <Text style={styles.quoteText}>{reading.fortuneQuote}</Text>
        <Text style={styles.quoteSource}>— Daily wisdom</Text>
      </Card>

      <Card style={styles.stack}>
        <SectionRow label="🐲 Chinese zodiac" value={reading.chineseZodiac} />
        <View style={styles.divider} />
        <SectionRow label="💰 Money" value={reading.money} />
        <View style={styles.divider} />
        <SectionRow label="💗 Love" value={reading.love} />
        <View style={styles.divider} />
        <SectionRow label="📌 Work" value={reading.work} />
        <View style={styles.divider} />
        <SectionRow label="🌿 Health" value={reading.health} />
        <View style={styles.divider} />
        <SectionRow label="🧿 Warning" value={reading.warning} />
        <View style={styles.divider} />
        <SectionRow label="🍀 Small action" value={reading.action} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  top: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  date: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  quoteCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  quoteDecor: {
    color: '#7B6CB8',
    fontSize: 32,
    lineHeight: 36,
    opacity: 0.6,
  },
  quoteText: {
    color: '#3D2D80',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  quoteSource: {
    color: '#7B6CB8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  stack: {
    gap: 0,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
});
