import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AlmanacReveal } from '../src/components/AlmanacReveal';
import { AppButton } from '../src/components/AppButton';
import { BirthdayPicker } from '../src/components/BirthdayPicker';
import { Card } from '../src/components/Card';
import { MediaConsentCard } from '../src/components/MediaConsentCard';
import { ProfilePhotoCapture } from '../src/components/ProfilePhotoCapture';
import { Screen } from '../src/components/Screen';
import { TimePickerInput } from '../src/components/TimePickerInput';
import { isValidDateKey } from '../src/lib/date';
import { elementEmoji, getZodiacElement } from '../src/lib/chineseZodiac';
import { createProfile, getChineseZodiac } from '../src/lib/luck';
import { isValidReminderTime, syncLocalDailyReminder } from '../src/lib/notifications';
import { saveStoredProfile } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { MainFocus } from '../src/types';

async function triggerLightHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

const focusOptions: MainFocus[] = ['Money', 'Love', 'Work', 'Health', 'Luck'];
const focusEmoji: Record<MainFocus, string> = {
  Money: '💰',
  Love: '💗',
  Work: '📌',
  Health: '🌿',
  Luck: '🍀',
};
const totalSteps = 4;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [mainFocus, setMainFocus] = useState<MainFocus[]>([]);
  const [notificationTime, setNotificationTime] = useState('');
  const [faceUri, setFaceUri] = useState('');
  const [leftPalmUri, setLeftPalmUri] = useState('');
  const [rightPalmUri, setRightPalmUri] = useState('');
  const [handwritingUri, setHandwritingUri] = useState('');
  const [faceUpdatedAt, setFaceUpdatedAt] = useState('');
  const [leftPalmUpdatedAt, setLeftPalmUpdatedAt] = useState('');
  const [rightPalmUpdatedAt, setRightPalmUpdatedAt] = useState('');
  const [handwritingUpdatedAt, setHandwritingUpdatedAt] = useState('');
  const [acceptedMediaConsent, setAcceptedMediaConsent] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [1, 2, 3, 4],
    outputRange: ['25%', '50%', '75%', '100%']
  });

  function goNext() {
    if (step === 2 && !validateIdentity()) {
      return;
    }

    if (step === 3 && !validateFocus()) {
      return;
    }

    setStep((current) => Math.min(totalSteps, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function validateIdentity() {
    if (!nickname.trim()) {
      Alert.alert('Nickname needed', 'Add the name you want LuckyDay to use.');
      return false;
    }

    if (!isValidDateKey(birthday.trim())) {
      Alert.alert('Birthday needed', 'Fill in a valid year, month, and day.');
      return false;
    }

    return true;
  }

  function validateFocus() {
    if (mainFocus.length === 0) {
      Alert.alert('Main focus needed', 'Choose at least one focus for your daily reading.');
      return false;
    }

    if (!isValidReminderTime(notificationTime.trim())) {
      Alert.alert('Reminder time', 'Use a 24-hour time like 08:00.');
      return false;
    }

    return true;
  }

  async function saveProfile() {
    if (!validateIdentity() || !validateFocus()) {
      return;
    }

    if (hasAnyPhoto([faceUri, leftPalmUri, rightPalmUri, handwritingUri]) && !acceptedMediaConsent) {
      Alert.alert('Photo privacy', 'Agree to the local photo storage note before saving optional photos.');
      return;
    }

    const profile = createProfile({
      nickname,
      birthday,
      birthTime,
      birthplace,
      mainFocus,
      notificationTime,
      photos: {
        faceUri,
        leftPalmUri,
        rightPalmUri,
        handwritingUri,
      },
      photoTimestamps: {
        faceUpdatedAt,
        leftPalmUpdatedAt,
        rightPalmUpdatedAt,
        handwritingUpdatedAt,
      },
      mediaConsentAt: new Date().toISOString(),
    });

    await saveStoredProfile(profile);
    await showReminderStatus(syncLocalDailyReminder(notificationTime));

    // Trigger the 1.5s reveal overlay; it calls router.replace when done.
    // The paywall surfaces naturally when they tap any locked feature.
    setRevealing(true);
  }

  return (
    <Screen key={step} contentStyle={styles.screenContent}>
      <Card style={styles.intro}>
        {/* Decorative circles for depth */}
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: widthInterpolation }]} />
        </View>
        <Text style={styles.title}>{getStepTitle(step)}</Text>
        <Text style={styles.copy}>
          {getStepCopy(step)}
        </Text>
        {step === 1 ? <View style={styles.legalLinks}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Read Privacy Policy"
            onPress={() => router.push('/privacy')}
            style={({ pressed }) => [styles.privacyLink, pressed && { opacity: 0.65 }]}
          >
            <Text style={styles.privacyLinkText}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Read Terms of Service"
            onPress={() => router.push('/terms')}
            style={({ pressed }) => [styles.privacyLink, pressed && { opacity: 0.65 }]}
          >
            <Text style={styles.privacyLinkText}>Terms</Text>
          </Pressable>
        </View> : null}
      </Card>

      {step === 1 ? (
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Your first reading should feel earned.</Text>
          <Text style={styles.welcomeCopy}>
            LuckyDay blends your birthday-based zodiac, your chosen focus, the lunar calendar, moon phase, and seasonal timing into one calm daily check-in.
          </Text>
          <Text style={styles.welcomeCopy}>
            Your birthday helps anchor the zodiac and lunar context. Birth time and place are optional and can be skipped.
          </Text>
        </Card>
      ) : null}

      {step === 2 ? <View style={styles.form}>
        <Field label="Nickname" value={nickname} onChangeText={setNickname} placeholder="Mali" />
        <View style={styles.group}>
          <Text style={styles.label}>Birthday</Text>
          <BirthdayPicker value={birthday} onChange={setBirthday} />
        </View>
        {/* Magic-trick preview — fires the moment a valid birthday lands.
            Day-1 "this knows me" moment before the user finishes onboarding. */}
        {isValidDateKey(birthday.trim()) ? <BirthdayPreviewCard birthday={birthday.trim()} /> : null}
        <Field label="Birth time optional" value={birthTime} onChangeText={setBirthTime} placeholder="08:30" />
        <Field label="Birthplace optional" value={birthplace} onChangeText={setBirthplace} placeholder="Bangkok" />
      </View> : null}

      {step === 3 ? <View style={styles.form}>
        <View style={styles.group}>
          <Text style={styles.label}>Main focuses</Text>
          <View style={styles.chips}>
            {focusOptions.map((focus) => (
              <Pressable
                key={focus}
                onPress={() => { triggerLightHaptic(); setMainFocus((current) => toggleFocus(current, focus)); }}
                style={[styles.chip, mainFocus.includes(focus) && styles.selectedChip]}
              >
                <Text style={[styles.chipText, mainFocus.includes(focus) && styles.selectedChipText]}>
                  {focusEmoji[focus]} {focus}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helpText}>Choose one, a few, or all of them.</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>Morning reminder</Text>
          <TimePickerInput value={notificationTime} onChange={setNotificationTime} />
          <Text style={styles.helpText}>Optional. Leave empty to skip reminders.</Text>
        </View>
      </View> : null}

      {step === 4 ? <View style={styles.photoStack}>
        <Card style={styles.photoIntroCard}>
          <Text style={styles.photoIntroEmoji}>🌸</Text>
          <View style={styles.photoIntroCopy}>
            <Text style={styles.photoTitle}>Choose your charm photos</Text>
            <Text style={styles.photoCopy}>
              Add any photo that feels easy today. Skipping is completely fine — your daily almanac still works.
            </Text>
            <View style={styles.photoReadingList}>
              <Text style={styles.photoReadingText}>Face: energy field and presence</Text>
              <Text style={styles.photoReadingText}>Palm: life line patterns</Text>
              <Text style={styles.photoReadingText}>Handwriting: intention energy</Text>
            </View>
          </View>
        </Card>
        <MediaConsentCard accepted={acceptedMediaConsent} onChange={setAcceptedMediaConsent} />
        <ProfilePhotoCapture
          label="Face"
          hint="Take a clear photo in soft light."
          value={faceUri}
          onChange={(uri) => updatePhoto(uri, setFaceUri, setFaceUpdatedAt)}
          updatedAt={faceUpdatedAt}
          cameraType="front"
        />
        <ProfilePhotoCapture
          label="Left palm"
          hint="Open your left hand and show the full palm."
          value={leftPalmUri}
          onChange={(uri) => updatePhoto(uri, setLeftPalmUri, setLeftPalmUpdatedAt)}
          updatedAt={leftPalmUpdatedAt}
        />
        <ProfilePhotoCapture
          label="Right palm"
          hint="Open your right hand and show the full palm."
          value={rightPalmUri}
          onChange={(uri) => updatePhoto(uri, setRightPalmUri, setRightPalmUpdatedAt)}
          updatedAt={rightPalmUpdatedAt}
        />
        <ProfilePhotoCapture
          label="Handwriting"
          hint="Write: Today I choose to be present. Then take a photo."
          value={handwritingUri}
          onChange={(uri) => updatePhoto(uri, setHandwritingUri, setHandwritingUpdatedAt)}
          updatedAt={handwritingUpdatedAt}
        />
      </View> : null}

      <View style={styles.navActions}>
        {step > 1 ? <AppButton label="Back" variant="secondary" onPress={goBack} style={styles.backButton} /> : null}
        {step < totalSteps ? (
          <AppButton label="Continue" onPress={goNext} />
        ) : (
          <AppButton label="Show today's almanac" onPress={saveProfile} />
        )}
      </View>
      {revealing ? <AlmanacReveal onDone={() => router.replace('/detail')} /> : null}
    </Screen>
  );
}

function getStepTitle(step: number) {
  if (step === 1) return 'Welcome to LuckyDay ✨';
  if (step === 2) return 'Tell LuckyDay about you ✨';
  if (step === 3) return 'Choose your daily focus 🍀';
  return 'Add a personal touch 🌸';
}

function getStepCopy(step: number) {
  if (step === 1) return 'A simple daily dashboard for what to do, what to avoid, and when your energy is strongest.';
  if (step === 2) return 'Your profile stays on your phone. Private by default, easy to update anytime.';
  if (step === 3) return 'Pick what you want today’s guidance to support. Add a reminder if you want a daily nudge.';
  return 'Photos are optional and stay on this device. Skip them now or add them later from Settings.';
}

async function showReminderStatus(resultPromise: Promise<string>) {
  const result = await resultPromise;
  if (result === 'denied') {
    Alert.alert('Reminder not enabled', 'Notifications are off. You can allow them later in your device settings.');
  }
}

function toggleFocus(current: MainFocus[], focus: MainFocus) {
  if (current.includes(focus)) {
    return current.filter((item) => item !== focus);
  }

  return [...current, focus];
}

function updatePhoto(
  uri: string,
  setUri: (uri: string) => void,
  setUpdatedAt: (value: string) => void,
) {
  setUri(uri);
  setUpdatedAt(new Date().toISOString());
}

function hasAnyPhoto(values: string[]) {
  return values.some(Boolean);
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

function BirthdayPreviewCard({ birthday }: { birthday: string }) {
  const animal = getChineseZodiac(birthday);
  const element = getZodiacElement(animal, birthday);
  const emoji = element ? elementEmoji[element] : '✨';
  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewEmoji}>{emoji}</Text>
      <View style={styles.previewBody}>
        <Text style={styles.previewLabel}>The almanac already knows you</Text>
        <Text style={styles.previewTitle}>Year of the {animal} · {element} element</Text>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder }: FieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.luckyGold,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  previewEmoji: {
    fontSize: 38,
    lineHeight: 44,
  },
  previewBody: {
    flex: 1,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  previewTitle: {
    color: colors.mauve,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  screenContent: {
    overflow: 'hidden',
    paddingBottom: spacing.xl2,
  },
  intro: {
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    borderWidth: 2,
    overflow: 'hidden',
  },
  decorCircle1: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    height: 160,
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
  },
  decorCircle2: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 999,
    bottom: -30,
    height: 100,
    left: -20,
    position: 'absolute',
    width: 100,
  },
  stepLabel: {
    color: 'rgba(255, 240, 199, 0.85)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radii.pill,
    height: 6,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.champagne,
    borderRadius: radii.pill,
    height: '100%',
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 33,
  },
  copy: {
    color: 'rgba(255, 240, 230, 0.88)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  legalLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legalDot: {
    color: colors.champagne,
    fontSize: 14,
    fontWeight: '900',
  },
  privacyLink: {
    alignSelf: 'flex-start',
  },
  privacyLinkText: {
    color: colors.champagne,
    fontSize: 14,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  form: {
    gap: spacing.md,
  },
  welcomeCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    gap: spacing.sm,
  },
  welcomeTitle: {
    color: colors.mauve,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  welcomeCopy: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  navActions: {
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingBottom: spacing.lg,
    rowGap: spacing.md,
  },
  backButton: {
    marginBottom: spacing.xs,
  },
  photoStack: {
    gap: spacing.md,
  },
  photoIntroCard: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoIntroEmoji: {
    fontSize: 38,
    lineHeight: 46,
  },
  photoIntroCopy: {
    flex: 1,
  },
  photoTitle: {
    color: colors.mauve,
    fontSize: 22,
    fontWeight: '900',
  },
  photoCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  photoReadingList: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  photoReadingText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  group: {
    gap: spacing.sm,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  helpText: {
    color: colors.muted,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1.5,
    color: colors.ink,
    fontSize: 17,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedChip: {
    backgroundColor: colors.mauve,
    borderColor: colors.mauve,
  },
  chipText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedChipText: {
    color: colors.white,
  },
});
