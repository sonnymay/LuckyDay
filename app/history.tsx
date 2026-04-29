import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { getReadingStreak } from '../src/lib/streak';
import { getStoredProfile, getStoredReadingHistory } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { DailyReading } from '../src/types';

export default function HistoryScreen() {
  const [history, setHistory] = useState<DailyReading[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getStoredProfile()
        .then((profile) => {
          if (!active) return;

          if (!profile) {
            router.replace('/');
            return;
          }

          return getStoredReadingHistory();
        })
        .then((items) => {
          if (active && items) {
            setHistory(items);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Screen>
      <Card style={styles.header}>
        <Text style={styles.title}>Reading history ✨</Text>
        <Text style={styles.copy}>Your recent LuckyDay readings stay on this device.</Text>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>{formatStreak(getReadingStreak(history))}</Text>
        </View>
      </Card>

      {history.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No saved readings yet</Text>
          <Text style={styles.copy}>Open Home each day to save that day’s luck energy here.</Text>
        </Card>
      ) : (
        history.map((reading) => <HistoryCard key={reading.date} reading={reading} />)
      )}
    </Screen>
  );
}

function HistoryCard({ reading }: { reading: DailyReading }) {
  return (
    <Card style={styles.historyCard}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.date}>{formatHistoryDate(reading.date)}</Text>
          <Text style={styles.message}>{reading.mainMessage}</Text>
        </View>
        <View style={styles.scoreBubble}>
          <Text style={styles.score}>{reading.score}</Text>
          <Text style={styles.scoreLabel}>energy</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <SectionRow label="🎨 Lucky color" value={reading.luckyColor} />
      <View style={styles.divider} />
      <SectionRow label="🌙 Moon" value={reading.moonPhase} />
      <View style={styles.divider} />
      <SectionRow label="🍀 Small action" value={reading.action} />
    </Card>
  );
}

function formatHistoryDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatStreak(value: number) {
  return `${value} ${value === 1 ? 'day' : 'days'} streak`;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  title: {
    color: colors.mauve,
    fontSize: 28,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  streakPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  streakText: {
    color: colors.goldDeep,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: colors.sunrise,
    borderColor: colors.roseGold,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  historyCard: {
    backgroundColor: colors.sunrise,
    borderColor: colors.roseGold,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  date: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  message: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: spacing.xs,
  },
  scoreBubble: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 34,
    borderWidth: 2,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  score: {
    color: colors.goldDeep,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  scoreLabel: {
    color: colors.mauve,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
});
