import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

async function triggerShareHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
import { router, useFocusEffect } from 'expo-router';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getStoredProfile } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
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
      {/* ── Date + main message ── */}
      <Card style={styles.top}>
        <Text style={styles.date}>✨ {reading.date}</Text>
        <Text style={styles.title}>{reading.mainMessage}</Text>
      </Card>

      {/* ── Lucky metrics at a glance ── */}
      <View style={styles.quickRow}>
        <View style={[styles.quickCard, { flex: 3 }]}>
          <View style={[styles.colorSwatch, { backgroundColor: getLuckyColorHex(reading.luckyColor) }]} />
          <View style={styles.quickCopy}>
            <Text style={styles.quickLabel}>Lucky color</Text>
            <Text style={styles.quickValue}>{reading.luckyColor}</Text>
            <Text style={styles.colorMeaning}>{getLuckyColorMeaning(reading.luckyColor)}</Text>
          </View>
        </View>
        <View style={[styles.quickCard, styles.numberQuickCard, { flex: 2 }]}>
          <Text style={styles.quickLabel}>Lucky no.</Text>
          <Text style={styles.numberValue}>{reading.luckyNumber}</Text>
        </View>
      </View>
      <View style={styles.quickRow}>
        <View style={[styles.quickCard, styles.timeQuickCard, { flex: 1 }]}>
          <Text style={styles.quickLabel}>Best time</Text>
          <Text style={styles.quickValue}>{reading.luckyTime}</Text>
        </View>
        <View style={[styles.quickCard, styles.directionQuickCard, { flex: 1 }]}>
          <Text style={styles.quickLabel}>Direction</Text>
          <Text style={styles.quickValue}>{reading.luckyDirection}</Text>
        </View>
      </View>

      {/* ── Daily fortune quote ── */}
      {reading.fortuneQuote ? (
        <Card style={styles.quoteCard}>
          <Text style={styles.quoteDecor}>❝</Text>
          <Text style={styles.quoteText}>{reading.fortuneQuote}</Text>
          <Text style={styles.quoteSource}>— Daily wisdom</Text>
        </Card>
      ) : null}

      {/* ── Full reading breakdown ── */}
      <Card style={styles.stack}>
        <View style={styles.zodiacRow}>
          <View style={styles.zodiacHalf}>
            <SectionRow label="🐲 Chinese zodiac" value={reading.chineseZodiac} />
          </View>
          <View style={styles.zodiacDivider} />
          <View style={styles.zodiacHalf}>
            <SectionRow label="⭐ Western zodiac" value={reading.westernZodiac} />
          </View>
        </View>
        {reading.zodiacInsight ? (
          <>
            <View style={styles.divider} />
            <SectionRow label="🐲 Animal note" value={reading.zodiacInsight} />
          </>
        ) : null}
        {reading.westernZodiacInsight ? (
          <>
            <View style={styles.divider} />
            <SectionRow label="⭐ Star note" value={reading.westernZodiacInsight} />
          </>
        ) : null}
        <View style={styles.divider} />
        <SectionRow label={`🌙 ${reading.moonPhase}`} value={reading.moonMessage ?? ''} />
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

      {/* ── Share CTA ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share today's reading"
        style={({ pressed }) => [styles.shareButton, pressed && styles.sharePressed]}
        onPress={() => { triggerShareHaptic(); shareReading(reading); }}
      >
        <Text style={styles.shareLabel}>🔗 Share today's reading</Text>
      </Pressable>
    </Screen>
  );
}

function shareReading(reading: DailyReading) {
  Share.share({
    message: [
      `My LuckyDay reading for ${reading.date} ✨`,
      `\n"${reading.mainMessage}"`,
      `\n🎨 ${reading.luckyColor}  ·  🔢 ${reading.luckyNumber}  ·  ⏰ ${reading.luckyTime}  ·  🧭 ${reading.luckyDirection}`,
      reading.moonPhase ? `🌙 ${reading.moonPhase}` : '',
      `\n🍀 ${reading.action}`,
    ]
      .filter(Boolean)
      .join('\n'),
    title: "Today's LuckyDay reading",
  });
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
  // Lucky color + number quick row
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  colorSwatch: {
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 44,
    width: 44,
  },
  quickCopy: {
    flex: 1,
  },
  quickLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  colorMeaning: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
  numberQuickCard: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  numberValue: {
    color: colors.goldDeep,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 50,
  },
  // Fortune quote card
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
  // Breakdown card
  stack: {
    gap: 0,
  },
  zodiacRow: {
    flexDirection: 'row',
    gap: 0,
  },
  zodiacHalf: {
    flex: 1,
  },
  zodiacDivider: {
    backgroundColor: colors.line,
    marginHorizontal: spacing.md,
    width: 1,
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: spacing.md,
  },
  // Time + direction quick cards
  timeQuickCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    flexDirection: 'column',
    gap: 4,
  },
  directionQuickCard: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'column',
    gap: 4,
  },
  // Share button
  shareButton: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  sharePressed: {
    opacity: 0.76,
  },
  shareLabel: {
    color: colors.mauve,
    fontSize: 15,
    fontWeight: '900',
  },
});
