import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { todayKey } from '../src/lib/date';
import { getFeedbackForDate, getStoredProfile, saveFeedback } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { FeedbackRating } from '../src/types';

const ratings: FeedbackRating[] = ['Yes', 'Somewhat', 'No'];
const tagOptions = ['Money', 'Love', 'Work', 'Stress', 'Good luck', 'Bad luck'];

export default function FeedbackScreen() {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [tags, setTags] = useState<string[]>([]);
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

    router.back();
  }

  return (
    <Screen>
      <Card>
        <Text style={styles.title}>Was today accurate?</Text>
        <View style={styles.ratingRow}>
          {ratings.map((item) => (
            <Pressable
              key={item}
              onPress={() => setRating(item)}
              style={[styles.rating, rating === item && styles.selectedRating]}
            >
              <Text style={[styles.ratingText, rating === item && styles.selectedRatingText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Optional tags</Text>
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
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  rating: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
  },
  selectedRating: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  ratingText: {
    color: colors.ink,
    fontSize: 15,
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
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedTag: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.gold,
  },
  tagText: {
    color: colors.ink,
    fontWeight: '700',
  },
  selectedTagText: {
    color: colors.ink,
  },
});
