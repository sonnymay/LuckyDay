import { RefObject, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { EnergyScoreCard } from '../src/components/EnergyScoreCard';
import { LuckyMetricCard } from '../src/components/LuckyMetricCard';
import { LuckyShareCard } from '../src/components/LuckyShareCard';
import { Screen } from '../src/components/Screen';
import { SectionRow } from '../src/components/SectionRow';
import { generateDailyReading } from '../src/lib/luck';
import { getLuckyColorHex, getLuckyColorMeaning } from '../src/lib/luckyColor';
import { getStoredProfile } from '../src/lib/storage';
import { colors, spacing } from '../src/styles/theme';
import { DailyReading, Profile } from '../src/types';

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reading, setReading] = useState<DailyReading | null>(null);
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
          <Text style={styles.kicker}>✨ Today</Text>
          <Text style={styles.title}>Hi, {profile.nickname}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} style={styles.settings}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      <EnergyScoreCard label="✨ Today's luck energy" score={reading.score} message={reading.mainMessage} />

      <AppButton
        label={savingShareCard ? 'Saving your luck...' : "Share today's luck"}
        onPress={() => saveShareCard(reading, shareCardRef, setSavingShareCard)}
      />

      <Card style={styles.luckyCard}>
        <SectionRow label="🌿 Good for" value={reading.goodFor.join(', ')} />
        <View style={styles.divider} />
        <SectionRow label="🧿 Avoid" value={reading.avoid.join(', ')} />
      </Card>

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

      <Card style={styles.moonCard}>
        <SectionRow label="🌙 Moon energy" value={`${reading.moonPhase}: ${reading.moonMessage}`} />
      </Card>

      <Card style={styles.guidanceCard}>
        <SectionRow label="🍀 Small action" value={reading.action} />
      </Card>

      <View style={styles.actions}>
        <AppButton label="Daily detail" variant="secondary" onPress={() => router.push('/detail')} />
        <AppButton label="Was today accurate?" variant="secondary" onPress={() => router.push('/feedback')} />
      </View>

      <View style={styles.captureArea} pointerEvents="none">
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
    backgroundColor: colors.panelStrong,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  captureArea: {
    left: -10000,
    position: 'absolute',
    top: 0,
  },
});
