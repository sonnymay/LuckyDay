import { RefObject, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { ChineseZodiacCard } from '../src/components/ChineseZodiacCard';
import { EnergyScoreCard } from '../src/components/EnergyScoreCard';
import { LuckyMetricCard } from '../src/components/LuckyMetricCard';
import { LuckyShareCard } from '../src/components/LuckyShareCard';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getReadingStreak } from '../src/lib/streak';
import { getStoredProfile, getStoredReadingHistory, saveReadingHistoryItem } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { DailyReading, Profile } from '../src/types';

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [streak, setStreak] = useState(0);
  const [savingShareCard, setSavingShareCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const shareCardRef = useRef<ViewShot>(null);

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

          const dailyReading = generateDailyReading(storedProfile);
          setProfile(storedProfile);
          setReading(dailyReading);
          getStoredReadingHistory()
            .then((history) => {
              const nextHistory = [dailyReading, ...history.filter((item) => item.date !== dailyReading.date)];
              setStreak(getReadingStreak(nextHistory));
              return saveReadingHistoryItem(dailyReading);
            })
            .catch(() => undefined);
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
          <Text style={styles.kicker}>✨ Today</Text>
          <Text style={styles.title}>Hi, {profile.nickname}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settings}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      <EnergyScoreCard label="✨ Today's luck energy" score={reading.score} message={reading.mainMessage} />

      <View style={styles.grid}>
        <LuckyMetricCard label="🔢 Lucky number" value={String(reading.luckyNumber)} variant="number" />
        <LuckyMetricCard
          label="🎨 Lucky color"
          note={getLuckyColorMeaning(reading.luckyColor)}
          value={reading.luckyColor}
          swatchColor={getLuckyColorHex(reading.luckyColor)}
        />
        <LuckyMetricCard label="⏰ Lucky time" value={reading.luckyTime} />
        <LuckyMetricCard label="🧭 Direction" value={reading.luckyDirection} variant="direction" />
      </View>

      <ChineseZodiacCard animal={reading.chineseZodiac} />

      <Card style={styles.luckyCard}>
        {/* Almanac provenance badge */}
        <View style={styles.almanacRow}>
          <Text style={styles.almanacBadge}>📖  From the Chinese Almanac</Text>
          {reading.lunarDate ? <Text style={styles.almanacDate}>{reading.lunarDate}</Text> : null}
        </View>
        {reading.solarTerm ? <Text style={styles.solarTerm}>✦ {reading.solarTerm}</Text> : null}
        <View style={styles.divider} />
        <SectionRow label="🌿 Good for today" value={reading.goodFor.join(' · ')} />
        <View style={styles.divider} />
        <SectionRow label="🧿 Avoid today" value={reading.avoid.join(' · ')} />
      </Card>

      <Card style={styles.moonCard}>
        <SectionRow label="🌙 Moon energy" value={`${reading.moonPhase}: ${reading.moonMessage}`} />
      </Card>

      <Card style={styles.guidanceCard}>
        <SectionRow label="🍀 Small action" value={reading.action} />
      </Card>

      <Card style={styles.sharePromptCard}>
        <View style={styles.sharePromptHeader}>
          <Text style={styles.sharePromptEmoji}>💌</Text>
          <View style={styles.sharePromptCopy}>
            <Text style={styles.sharePromptTitle}>Send a little luck</Text>
            <Text style={styles.sharePromptText}>
              Save a cute story card for your group chat or morning check-in. No birthday, photos, or private details.
            </Text>
          </View>
        </View>
        <View style={styles.sharePills}>
          <Text style={styles.sharePill}>Story-ready</Text>
          <Text style={styles.sharePill}>Private by default</Text>
        </View>
      </Card>

      <AppButton
        label={savingShareCard ? 'Saving your luck...' : "Share today's luck"}
        onPress={() => saveShareCard(reading, shareCardRef, setSavingShareCard)}
      />

      <Card style={styles.streakCard}>
        <Text style={styles.streakLabel}>Daily ritual streak</Text>
        {streak === 0 ? (
          <>
            <Text style={styles.streakValue}>Start your ritual today ✨</Text>
            <Text style={styles.streakCopy}>Open LuckyDay each morning to build your streak.</Text>
          </>
        ) : (
          <>
            <Text style={styles.streakValue}>{streak} {streak === 1 ? 'day' : 'days'} ✨</Text>
            <Text style={styles.streakCopy}>Keep your morning ritual alive — open LuckyDay each day.</Text>
          </>
        )}
      </Card>

      <View style={styles.navGrid}>
        <Pressable style={styles.navCard} onPress={() => router.push('/detail')}>
          <Text style={styles.navEmoji}>📋</Text>
          <Text style={styles.navLabel}>Daily{'\n'}detail</Text>
        </Pressable>
        <Pressable style={styles.navCard} onPress={() => router.push('/history')}>
          <Text style={styles.navEmoji}>📖</Text>
          <Text style={styles.navLabel}>Reading{'\n'}history</Text>
        </Pressable>
        <Pressable style={styles.navCard} onPress={() => router.push('/feedback')}>
          <Text style={styles.navEmoji}>⭐</Text>
          <Text style={styles.navLabel}>Rate{'\n'}today</Text>
        </Pressable>
      </View>

      <View style={[styles.captureArea, styles.noPointerEvents]}>
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
          <LuckyShareCard reading={reading} />
        </ViewShot>
      </View>
    </Screen>
  );
}

async function saveShareCard(
  reading: DailyReading,
  shareCardRef: RefObject<ViewShot | null>,
  setSavingShareCard: (saving: boolean) => void,
) {
  if (savingFallbackNeeded()) {
    await Share.share({
      message: `My LuckyDay energy is ${reading.score}. ${reading.mainMessage} Lucky color: ${reading.luckyColor}. Lucky number: ${reading.luckyNumber}.`,
    });
    return;
  }

  try {
    setSavingShareCard(true);
    const uri = await shareCardRef.current?.capture?.();
    if (!uri) {
      Alert.alert('Share card not ready', 'Please try again in a moment.');
      return;
    }

    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) {
      Alert.alert(
        'Photos permission needed',
        'Allow photo access to save your LuckyDay card. You can change this in Settings anytime.',
      );
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Saved to your photos ✨', 'Your LuckyDay card is ready in your camera roll.');
      return;
    }

    Alert.alert('Saved to your photos ✨', 'Your LuckyDay card is ready. Want to share it now?', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Share now',
        onPress: () => {
          Sharing.shareAsync(uri, {
            dialogTitle: "Share today's LuckyDay",
            mimeType: 'image/png',
            UTI: 'public.png',
          });
        },
      },
    ]);
  } catch {
    Alert.alert('Could not save card', 'Please try again in a moment.');
  } finally {
    setSavingShareCard(false);
  }
}

function savingFallbackNeeded() {
  return Platform.OS === 'web';
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
    color: colors.mauve,
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
    color: colors.mauve,
    fontSize: 15,
    fontWeight: '800',
  },
  luckyCard: {
    backgroundColor: '#FBF5E8',
    borderColor: colors.roseGold,
  },
  almanacRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  almanacBadge: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  almanacDate: {
    color: colors.goldDeep,
    fontSize: 14,
    fontWeight: '800',
  },
  solarTerm: {
    color: colors.mauve,
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  guidanceCard: {
    backgroundColor: colors.sunrise,
    borderColor: colors.roseGold,
  },
  sharePromptCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    gap: spacing.md,
  },
  sharePromptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  sharePromptEmoji: {
    backgroundColor: colors.blush,
    borderColor: colors.roseGold,
    borderRadius: 28,
    borderWidth: 1.5,
    fontSize: 30,
    height: 56,
    lineHeight: 52,
    overflow: 'hidden',
    textAlign: 'center',
    width: 56,
  },
  sharePromptCopy: {
    flex: 1,
  },
  sharePromptTitle: {
    color: colors.mauve,
    fontSize: 20,
    fontWeight: '900',
  },
  sharePromptText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sharePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sharePill: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  streakCard: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
  },
  streakLabel: {
    color: colors.goldDeep,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  streakValue: {
    color: colors.mauve,
    fontSize: 34,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  streakCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  navGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  navCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 20,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  navEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  navLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  captureArea: {
    left: -10000,
    position: 'absolute',
    top: 0,
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
});
