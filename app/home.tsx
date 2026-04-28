import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getStoredProfile } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { DailyReading, Profile } from '../src/types';

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getStoredProfile()
        .then((storedProfile) => {
          if (!active) return;

          if (!storedProfile) {
            router.replace('/');
            return;
          }

          setProfile(storedProfile);
          setReading(generateDailyReading(storedProfile));
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  if (loading || !profile || !reading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Today</Text>
          <Text style={styles.title}>Hi, {profile.nickname}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settings}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      <Card style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Today Score</Text>
        <Text style={styles.score}>{reading.score}/100</Text>
        <Text style={styles.message}>{reading.mainMessage}</Text>
      </Card>

      <Card>
        <SectionRow label="Good for" value={reading.goodFor.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="Avoid" value={reading.avoid.join(', ')} />
      </Card>

      <View style={styles.grid}>
        <MiniCard label="Lucky number" value={String(reading.luckyNumber)} />
        <MiniCard label="Lucky color" value={reading.luckyColor} />
        <MiniCard label="Lucky time" value={reading.luckyTime} />
        <MiniCard label="Direction" value={reading.luckyDirection} />
      </View>

      <Card>
        <SectionRow label="Small action" value={reading.action} />
      </Card>

      <View style={styles.actions}>
        <AppButton label="Daily detail" onPress={() => router.push('/detail')} />
        <AppButton label="Was today accurate?" variant="secondary" onPress={() => router.push('/feedback')} />
      </View>
    </Screen>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.miniCard}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
  },
  settings: {
    padding: spacing.sm,
  },
  settingsText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  scoreCard: {
    backgroundColor: colors.ink,
    minHeight: 210,
  },
  scoreLabel: {
    color: colors.panelStrong,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  score: {
    color: colors.white,
    fontSize: 72,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  message: {
    color: colors.panelStrong,
    fontSize: 18,
    lineHeight: 26,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  miniCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
  },
  miniLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  miniValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
});
