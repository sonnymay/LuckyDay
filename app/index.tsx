import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getStoredProfile } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { Profile } from '../src/types';

const sampleProfile: Profile = {
  id: 'sample',
  nickname: 'Mali',
  birthday: '1996-04-13',
  mainFocus: 'Work',
  westernZodiac: 'Aries',
  chineseZodiac: 'Rat',
  photos: {
    faceUri: '',
    leftPalmUri: '',
    rightPalmUri: '',
    handwritingUri: '',
  },
  mediaConsentAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export default function WelcomeScreen() {
  const [checkingProfile, setCheckingProfile] = useState(true);
  const sample = useMemo(() => generateDailyReading(sampleProfile), []);

  useEffect(() => {
    getStoredProfile()
      .then((profile) => {
        if (profile) {
          router.replace('/home');
        }
      })
      .finally(() => setCheckingProfile(false));
  }, []);

  if (checkingProfile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.name}>LuckyDay</Text>
        <Text style={styles.tagline}>Your daily luck guide.</Text>
      </View>

      <Card style={styles.scoreCard}>
        <Text style={styles.smallLabel}>Sample reading</Text>
        <Text style={styles.score}>{sample.score}/100</Text>
        <Text style={styles.message}>{sample.mainMessage}</Text>
      </Card>

      <Card>
        <SectionRow label="Good for" value={sample.goodFor.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="Avoid" value={sample.avoid.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="Lucky color" value={sample.luckyColor} />
        <View style={styles.divider} />
        <SectionRow label="Action" value={sample.action} />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.prompt}>Want your personal LuckyDay?</Text>
        <AppButton label="Create my profile" onPress={() => router.push('/onboarding')} />
      </View>
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
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  name: {
    color: colors.ink,
    fontSize: 44,
    fontWeight: '900',
  },
  tagline: {
    color: colors.muted,
    fontSize: 18,
  },
  scoreCard: {
    backgroundColor: colors.ink,
  },
  smallLabel: {
    color: colors.panelStrong,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  score: {
    color: colors.white,
    fontSize: 68,
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
  footer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  prompt: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
});
