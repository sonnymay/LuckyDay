import { useCallback, useRef, useState } from 'react';
import { Animated, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { todayKey } from '../src/lib/date';
import { getFeedbackForDate, getStoredProfile, saveFeedback } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { FeedbackRating } from '../src/types';

const ratings: FeedbackRating[] = ['Yes', 'Somewhat', 'No'];

function ratingEmoji(rating: FeedbackRating) {
  if (rating === 'Yes') return '🍀';
  if (rating === 'Somewhat') return '🌙';
  return '🌧️';
}
const tagOptions = ['Money', 'Love', 'Work', 'Health', 'Stress', 'Good luck', 'Bad luck', 'Surprise'];

async function triggerSelectionHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

async function triggerSuccessHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export default function FeedbackScreen() {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const savedAnim = useRef(new Animated.Value(0)).current;
  const date = todayKey();

  useFocusEffect(
    useCallback(() => {
      getStoredProfile().then((profile) => {
        if (!profile) router.replace('/');
      });

      getFeedbackForDate(date).then((feedback) => {
        if (feedback) {
          setRating(feedback.rating);
          setTags(feedback.tags);
        }
      });
    }, [date]),
  );

  function toggleTag(tag: string) {
    triggerSelectionHaptic();
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  async function submit() {
    if (!rating) return;

    await saveFeedback({
      id: `${date}-${Date.now()}`,
      date,
      rating,
      tags,
      createdAt: new Date().toISOString(),
    });

    triggerSuccessHaptic();
    setSaved(true);
    Animated.timing(savedAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => router.back(), 1200);
  }

  if (saved) {
    return (
      <SafeAreaView style={styles.savedScreen}>
        <Animated.View style={[styles.savedContainer, { opacity: savedAnim }]}>
          <Text style={styles.savedEmoji}>✨</Text>
          <Text style={styles.savedTitle}>Feedback saved!</Text>
          <Text style={styles.savedCopy}>Your rating helps shape tomorrow's reading.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <Text style={styles.title}>Did today feel lucky? ✨</Text>
        <Text style={styles.subtitle}>Your rating helps shape future readings.</Text>
        <View style={styles.ratingRow}>
          {ratings.map((item) => (
            <Pressable
              key={item}
              onPress={() => { triggerSelectionHaptic(); setRating(item); }}
              style={[styles.rating, rating === item && styles.selectedRating]}
            >
              <Text style={styles.ratingEmoji}>{ratingEmoji(item)}</Text>
              <Text style={[styles.ratingText, rating === item && styles.selectedRatingText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>What was in the energy today?</Text>
        <View style={styles.tags}>
          {tagOptions.map((tag) => (
            <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, tags.includes(tag) && styles.selectedTag]}>
              <Text style={[styles.tagText, tags.includes(tag) && styles.selectedTagText]}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <AppButton label="Save feedback" onPress={submit} variant={rating ? 'primary' : 'secondary'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  savedScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  savedContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  savedEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },
  savedTitle: {
    color: colors.mauve,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  savedCopy: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
  },
  title: {
    color: colors.mauve,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  rating: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 72,
  },
  selectedRating: {
    backgroundColor: colors.mauve,
    borderColor: colors.mauve,
  },
  ratingEmoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  ratingText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  selectedRatingText: {
    color: colors.white,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedTag: {
    backgroundColor: colors.mauve,
    borderColor: colors.mauve,
  },
  tagText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  selectedTagText: {
    color: colors.white,
  },
});
