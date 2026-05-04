import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
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
import { colors, radii, spacing } from '../src/styles/theme';
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
        <Text style={styles.sparkles}>🌸 ✦ 🌸</Text>
        <Text style={styles.name}>LuckyDay</Text>
        <Text style={styles.tagline}>Your daily ritual for luck, timing, and intention ✨</Text>
      </View>

      {/* ── How it works — 3 step strip ── */}
      <View style={styles.howItWorksRow}>
        {([
          { emoji: '🌸', label: 'Set up once', detail: 'Birthday → zodiac profile' },
          { emoji: '✨', label: 'Daily reading', detail: 'Score, color, guidance' },
          { emoji: '🔥', label: 'Build a streak', detail: 'Track your ritual' },
        ] as const).map((step, i) => (
          <View key={i} style={styles.howStep}>
            <View style={styles.howStepBubble}>
              <Text style={styles.howStepEmoji}>{step.emoji}</Text>
            </View>
            <Text style={styles.howStepLabel}>{step.label}</Text>
            <Text style={styles.howStepDetail}>{step.detail}</Text>
          </View>
        ))}
      </View>

      <EnergyScoreCard label="✨ Today's preview" score={sample.score} message={sample.mainMessage} />

      <ChineseZodiacCard animal={sample.chineseZodiac} insight={sample.zodiacInsight} />

      {/* ── Daily wisdom quote preview ── */}
      {sample.fortuneQuote ? (
        <View style={styles.quotePreview}>
          <Text style={styles.quoteDecor}>❝</Text>
          <Text style={styles.quotePreviewText}>{sample.fortuneQuote}</Text>
          <Text style={styles.quoteSource}>— Daily wisdom</Text>
        </View>
      ) : null}

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

      <Card style={styles.guidanceCard}>
        <SectionRow label="🌿 Good for" value={sample.goodFor.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="🧿 Avoid" value={sample.avoid.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="🍀 Small action" value={sample.action} />
      </Card>

      <View style={styles.footer}>
        {/* Trust signals */}
        <View style={styles.trustRow}>
          <Text style={styles.trustBadge}>✦ Free to start</Text>
          <Text style={styles.trustBadge}>✦ No account needed</Text>
          <Text style={styles.trustBadge}>✦ 2-min setup</Text>
        </View>
        <Text style={styles.prompt}>Ready to call in your luck?</Text>
        <AppButton label="Create my lucky profile" onPress={() => router.push('/onboarding')} />
        <Text style={styles.almanacNote}>Powered by the Chinese Almanac · 24 Solar Terms · Moon phases</Text>
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
    fontSize: 26,
    letterSpacing: 10,
  },
  name: {
    color: colors.mauve,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  // How it works strip
  howItWorksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  howStep: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.md,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
    ...Platform.select({
      web: { boxShadow: `0 4px 12px rgba(192, 58, 120, 0.1)` },
      default: {
        shadowColor: colors.mauve,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  howStepBubble: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  howStepEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  howStepLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  howStepDetail: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
  },
  // Trust signals
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  trustBadge: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  almanacNote: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Fortune quote preview
  quotePreview: {
    alignItems: 'center',
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  quoteDecor: {
    color: '#7B6CB8',
    fontSize: 28,
    lineHeight: 32,
    opacity: 0.6,
  },
  quotePreviewText: {
    color: '#3D2D80',
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  quoteSource: {
    color: '#7B6CB8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  guidanceCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
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
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
});
