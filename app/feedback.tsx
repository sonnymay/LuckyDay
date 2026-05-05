import { useCallback, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { todayKey } from '../src/lib/date';
import { getFeedbackForDate, getStoredProfile, saveFeedback } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { FeedbackRating } from '../src/types';

const dayRatings = [1, 2, 3, 4, 5];
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
  const params = useLocalSearchParams<{ date?: string }>();
  const date = typeof params.date === 'string' ? params.date : todayKey();
  const [overallDay, setOverallDay] = useState<number | null>(null);
  const [bestTimeAccurate, setBestTimeAccurate] = useState<boolean | null>(null);
  const [warningRelevant, setWarningRelevant] = useState<boolean | null>(null);
  const [actionHelpful, setActionHelpful] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const savedAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      getStoredProfile().then((profile) => {
        if (!profile) router.replace('/');
      });

      getFeedbackForDate(date).then((feedback) => {
        if (feedback) {
          setOverallDay(feedback.overallDay ?? ratingToDayScore(feedback.rating));
          setBestTimeAccurate(feedback.bestTimeAccurate ?? null);
          setWarningRelevant(feedback.warningRelevant ?? null);
          setActionHelpful(feedback.actionHelpful ?? null);
          setNote(feedback.note ?? '');
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
    if (!overallDay) return;

    await saveFeedback({
      id: `${date}-${Date.now()}`,
      date,
      rating: dayScoreToRating(overallDay),
      overallDay,
      bestTimeAccurate: bestTimeAccurate ?? undefined,
      warningRelevant: warningRelevant ?? undefined,
      actionHelpful: actionHelpful ?? undefined,
      note: note.trim() || undefined,
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
        <View style={styles.savedAura1} pointerEvents="none" />
        <View style={styles.savedAura2} pointerEvents="none" />
        <Animated.View style={[styles.savedContainer, { opacity: savedAnim }]}>
          <Text style={styles.savedEmoji}>✨</Text>
          <Text style={styles.savedTitle}>Reflection saved</Text>
          <Text style={styles.savedCopy}>Your journal is building a clearer pattern.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <Text style={styles.dateLabel}>{formatReflectionDate(date)}</Text>
        <Text style={styles.title}>How did the day actually feel?</Text>
        <Text style={styles.subtitle}>A quick reflection helps compare the reading with real life.</Text>
        <View style={styles.dayRatingRow}>
          {dayRatings.map((item) => (
            <Pressable
              key={item}
              onPress={() => { triggerSelectionHaptic(); setOverallDay(item); }}
              style={[styles.dayRating, overallDay === item && styles.selectedDayRating]}
            >
              <Text style={[styles.dayRatingText, overallDay === item && styles.selectedDayRatingText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.scaleHint}>1 was heavy. 5 was unusually good.</Text>
      </Card>

      <Card>
        <Text style={styles.label}>Prediction vs. reality</Text>
        <ReflectionToggle label="Best time felt accurate" value={bestTimeAccurate} onChange={setBestTimeAccurate} />
        <ReflectionToggle label="Warning felt relevant" value={warningRelevant} onChange={setWarningRelevant} />
        <ReflectionToggle label="Do This Today helped" value={actionHelpful} onChange={setActionHelpful} />
      </Card>

      <Card>
        <Text style={styles.label}>What was in the energy?</Text>
        <View style={styles.tags}>
          {tagOptions.map((tag) => (
            <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, tags.includes(tag) && styles.selectedTag]}>
              <Text style={[styles.tagText, tags.includes(tag) && styles.selectedTagText]}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Small note optional</Text>
        <TextInput
          multiline
          onChangeText={setNote}
          placeholder="What matched, missed, or surprised you?"
          placeholderTextColor={colors.faint}
          style={styles.noteInput}
          value={note}
        />
      </Card>

      <AppButton label="Save reflection" onPress={submit} variant={overallDay ? 'primary' : 'secondary'} />
    </Screen>
  );
}

function ReflectionToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.reflectionRow}>
      <Text style={styles.reflectionLabel}>{label}</Text>
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => { triggerSelectionHaptic(); onChange(true); }}
          style={[styles.toggleButton, value === true && styles.selectedToggle]}
        >
          <Text style={[styles.toggleText, value === true && styles.selectedToggleText]}>Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => { triggerSelectionHaptic(); onChange(false); }}
          style={[styles.toggleButton, value === false && styles.selectedToggle]}
        >
          <Text style={[styles.toggleText, value === false && styles.selectedToggleText]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

function dayScoreToRating(score: number): FeedbackRating {
  if (score >= 4) return 'Yes';
  if (score === 3) return 'Somewhat';
  return 'No';
}

function ratingToDayScore(value: FeedbackRating): number {
  if (value === 'Yes') return 5;
  if (value === 'Somewhat') return 3;
  return 2;
}

function formatReflectionDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  savedScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  savedAura1: {
    backgroundColor: 'rgba(192, 58, 120, 0.08)',
    borderRadius: 999,
    height: 320,
    position: 'absolute',
    right: -90,
    top: -90,
    width: 320,
  },
  savedAura2: {
    backgroundColor: 'rgba(237, 186, 64, 0.06)',
    borderRadius: 999,
    bottom: 60,
    height: 220,
    left: -60,
    position: 'absolute',
    width: 220,
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
  dateLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
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
  dayRatingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dayRating: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  selectedDayRating: {
    backgroundColor: colors.mauve,
    borderColor: colors.mauve,
  },
  dayRatingText: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '900',
  },
  selectedDayRatingText: {
    color: colors.white,
  },
  scaleHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reflectionRow: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  reflectionLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleButton: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedToggle: {
    backgroundColor: colors.mauve,
    borderColor: colors.mauve,
  },
  toggleText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  selectedToggleText: {
    color: colors.white,
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
  noteInput: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1.5,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22,
    marginTop: spacing.md,
    minHeight: 96,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
});
