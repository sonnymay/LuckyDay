import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { MediaConsentCard } from '../src/components/MediaConsentCard';
import { ProfilePhotoCapture } from '../src/components/ProfilePhotoCapture';
import { Screen } from '../src/components/Screen';
import { isValidDateKey } from '../src/lib/date';
import { createProfile } from '../src/lib/luck';
import { saveStoredProfile } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { MainFocus } from '../src/types';

const focusOptions: MainFocus[] = ['Money', 'Love', 'Work', 'Health', 'Luck'];
const totalSteps = 3;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [mainFocus, setMainFocus] = useState<MainFocus[]>(['Luck']);
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

  function goNext() {
    if (step === 1 && !validateIdentity()) {
      return;
    }

    if (step === 2 && !validateFocus()) {
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
      Alert.alert('Birthday needed', 'Use the format YYYY-MM-DD, like 1995-03-22.');
      return false;
    }

    return true;
  }

  function validateFocus() {
    if (mainFocus.length === 0) {
      Alert.alert('Main focus needed', 'Choose at least one focus for your daily reading.');
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
    router.replace('/home');
  }

  return (
    <Screen>
      <Card style={styles.intro}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.title}>{getStepTitle(step)}</Text>
        <Text style={styles.copy}>
          {getStepCopy(step)}
        </Text>
      </Card>

      {step === 1 ? <View style={styles.form}>
        <Field label="Nickname" value={nickname} onChangeText={setNickname} placeholder="Mali" />
        <Field label="Birthday" value={birthday} onChangeText={setBirthday} placeholder="e.g. 1995-03-22" />
        <Field label="Birth time optional" value={birthTime} onChangeText={setBirthTime} placeholder="08:30" />
        <Field label="Birthplace optional" value={birthplace} onChangeText={setBirthplace} placeholder="Bangkok" />
      </View> : null}

      {step === 2 ? <View style={styles.form}>
        <View style={styles.group}>
          <Text style={styles.label}>Main focuses</Text>
          <View style={styles.chips}>
            {focusOptions.map((focus) => (
              <Pressable
                key={focus}
                onPress={() => setMainFocus((current) => toggleFocus(current, focus))}
                style={[styles.chip, mainFocus.includes(focus) && styles.selectedChip]}
              >
                <Text style={[styles.chipText, mainFocus.includes(focus) && styles.selectedChipText]}>{focus}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helpText}>Choose one, a few, or all of them.</Text>
        </View>

        <Field
          label="Notification time optional"
          value={notificationTime}
          onChangeText={setNotificationTime}
          placeholder="08:00"
        />
      </View> : null}

      {step === 3 ? <View style={styles.photoStack}>
        <Text style={styles.photoTitle}>Optional luck photos 🍀</Text>
        <Text style={styles.photoCopy}>You can skip these now and add them later in Settings.</Text>
        <MediaConsentCard accepted={acceptedMediaConsent} onChange={setAcceptedMediaConsent} />
        <ProfilePhotoCapture
          label="Face"
          hint="Take a clear photo in soft light."
          value={faceUri}
          onChange={(uri) => updatePhoto(uri, setFaceUri, setFaceUpdatedAt)}
          updatedAt={faceUpdatedAt}
          cameraType={ImagePicker.CameraType.front}
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
          hint="Write: Today I choose steady luck. Then take a photo."
          value={handwritingUri}
          onChange={(uri) => updatePhoto(uri, setHandwritingUri, setHandwritingUpdatedAt)}
          updatedAt={handwritingUpdatedAt}
        />
      </View> : null}

      <View style={styles.navActions}>
        {step > 1 ? <AppButton label="Back" variant="secondary" onPress={goBack} /> : null}
        {step < totalSteps ? (
          <AppButton label="Continue" onPress={goNext} />
        ) : (
          <AppButton label="Show today's luck" onPress={saveProfile} />
        )}
      </View>
    </Screen>
  );
}

function getStepTitle(step: number) {
  if (step === 1) return 'Tell LuckyDay about you ✨';
  if (step === 2) return 'Choose your daily focus 🍀';
  return 'Optional luck photos 🔒';
}

function getStepCopy(step: number) {
  if (step === 1) return 'Your profile stays on your phone. Private by default, easy to update anytime.';
  if (step === 2) return 'Pick what you want today’s guidance to support. You can choose one, a few, or all.';
  return 'Photos are optional. Skip them now or add them later from Settings.';
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
  intro: {
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
    borderWidth: 2,
  },
  stepLabel: {
    color: colors.champagne,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 240, 199, 0.28)',
    borderRadius: radii.pill,
    height: 8,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.luckyGold,
    borderRadius: radii.pill,
    height: '100%',
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  copy: {
    color: colors.sunrise,
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  navActions: {
    gap: spacing.sm,
  },
  photoStack: {
    gap: spacing.md,
  },
  photoTitle: {
    color: colors.mauve,
    fontSize: 24,
    fontWeight: '900',
  },
  photoCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
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
    borderWidth: 1,
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
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedChip: {
    backgroundColor: colors.mauve,
    borderColor: colors.mauve,
  },
  chipText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedChipText: {
    color: colors.white,
  },
});
