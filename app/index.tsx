import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { ChineseZodiacCard } from '../src/components/ChineseZodiacCard';
import { EnergyScoreCard } from '../src/components/EnergyScoreCard';
import { LuckyMetricCard } from '../src/components/LuckyMetricCard';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getStoredProfile } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { Profile } from '../src/types';

const sampleProfile: Profile = {
  id: 'sample',
  nickname: 'Mali',
  birthday: '1996-04-13',
  mainFocus: ['Work'],
  westernZodiac: 'Aries',
  chineseZodiac: 'Rat',
  photos: {
    faceUri: '',
    leftPalmUri: '',
    rightPalmUri: '',
    handwritingUri: '',
  },
  photoTimestamps: {},
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
        <Text style={styles.sparkles}>☾ ✦ ✧</Text>
        <Text style={styles.name}>LuckyDay</Text>
        <Text style={styles.tagline}>A morning ritual for luck, timing, and intention.</Text>
      </View>

      <EnergyScoreCard label="✨ Today's preview" score={sample.score} message={sample.mainMessage} />

      <ChineseZodiacCard animal={sample.chineseZodiac} />

      <View style={styles.grid}>
        <LuckyMetricCard
          label="🎨 Lucky color"
          note={getLuckyColorMeaning(sample.luckyColor)}
          value={sample.luckyColor}
          swatchColor={getLuckyColorHex(sample.luckyColor)}
        />
        <LuckyMetricCard label="🔢 Lucky number" value={String(sample.luckyNumber)} variant="number" />
        <LuckyMetricCard label="⏰ Best time" value={sample.luckyTime} />
        <LuckyMetricCard label="🧭 Direction" value={sample.luckyDirection} variant="direction" />
      </View>

      <Card style={styles.moonCard}>
        <SectionRow label="🌙 Moon energy" value={`${sample.moonPhase}: ${sample.moonMessage}`} />
        <View style={styles.divider} />
        <SectionRow label="🇹🇭 Thai day color" value={`${sample.thaiDayColor}: ${sample.thaiDayColorMessage}`} />
      </Card>

      <Card style={styles.guidanceCard}>
        <SectionRow label="🌿 Good for" value={sample.goodFor.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="🧿 Avoid" value={sample.avoid.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="🍀 Small action" value={sample.action} />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.prompt}>Ready to call in your luck?</Text>
        <AppButton label="Create my lucky profile" onPress={() => router.push('/onboarding')} />
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
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sparkles: {
    color: colors.roseGold,
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    color: colors.mauve,
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
  },
  tagline: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  guidanceCard: {
    backgroundColor: colors.sunrise,
    borderColor: colors.roseGold,
  },
  moonCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
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
    color: colors.mauve,
    fontSize: 22,
    fontWeight: '800',
  },
});
