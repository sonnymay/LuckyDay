import { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { ProfilePhotoCapture } from '../src/components/ProfilePhotoCapture';
import { Screen } from '../src/components/Screen';
import { isValidDateKey } from '../src/lib/date';
import { createProfile, normalizeMainFocuses } from '../src/lib/luck';
import { getStoredProfile, resetAllStoredData, resetStoredFeedback, resetStoredProfile, saveStoredProfile } from '../src/lib/storage';
import { colors, radii, spacing } from '../src/styles/theme';
import { MainFocus, Profile } from '../src/types';

const focusOptions: MainFocus[] = ['Money', 'Love', 'Work', 'Health', 'Luck'];

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
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

  useFocusEffect(
    useCallback(() => {
      getStoredProfile().then((storedProfile) => {
        if (!storedProfile) {
          router.replace('/');
          return;
        }

        setProfile(storedProfile);
        setNickname(storedProfile.nickname);
        setBirthday(storedProfile.birthday);
        setMainFocus(normalizeMainFocuses(storedProfile.mainFocus));
        setNotificationTime(storedProfile.notificationTime ?? '');
        setFaceUri(storedProfile.photos?.faceUri ?? '');
        setLeftPalmUri(storedProfile.photos?.leftPalmUri ?? '');
        setRightPalmUri(storedProfile.photos?.rightPalmUri ?? '');
        setHandwritingUri(storedProfile.photos?.handwritingUri ?? '');
        setFaceUpdatedAt(storedProfile.photoTimestamps?.faceUpdatedAt ?? '');
        setLeftPalmUpdatedAt(storedProfile.photoTimestamps?.leftPalmUpdatedAt ?? '');
        setRightPalmUpdatedAt(storedProfile.photoTimestamps?.rightPalmUpdatedAt ?? '');
        setHandwritingUpdatedAt(storedProfile.photoTimestamps?.handwritingUpdatedAt ?? '');
      });
    }, []),
  );

  async function saveSettings() {
    if (!profile) return;

    if (!nickname.trim()) {
      Alert.alert('Nickname needed', 'Add the name you want LuckyDay to use.');
      return;
    }

    if (!isValidDateKey(birthday.trim())) {
      Alert.alert('Birthday needed', 'Use the format YYYY-MM-DD.');
      return;
    }

    if (mainFocus.length === 0) {
      Alert.alert('Main focus needed', 'Choose at least one focus for your daily reading.');
      return;
    }

    const nextProfile = {
      ...createProfile({
        nickname,
        birthday,
        birthTime: profile.birthTime,
        birthplace: profile.birthplace,
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
        mediaConsentAt: profile.mediaConsentAt,
      }),
      id: profile.id,
      createdAt: profile.createdAt,
    };

    await saveStoredProfile(nextProfile);
    router.replace('/home');
  }

  function confirmReset() {
    Alert.alert('Reset profile?', 'This clears your local profile on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetStoredProfile();
          router.replace('/');
        },
      },
    ]);
  }

  function confirmClearFeedback() {
    Alert.alert('Clear feedback?', 'This removes your saved accuracy ratings and tags from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await resetStoredFeedback();
          Alert.alert('Feedback cleared', 'Your saved feedback has been removed.');
        },
      },
    ]);
  }

  function confirmDeleteLocalData() {
    Alert.alert('Delete all local data?', 'This clears your profile, photos, and feedback from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await resetAllStoredData();
          router.replace('/');
        },
      },
    ]);
  }

  function confirmDeletePhotosOnly() {
    if (!profile) return;

    Alert.alert('Delete photos only?', 'This keeps your profile details and feedback, but removes saved photo links from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete photos',
        style: 'destructive',
        onPress: async () => {
          const nextProfile = {
            ...profile,
            photos: {
              faceUri: '',
              leftPalmUri: '',
              rightPalmUri: '',
              handwritingUri: '',
            },
            photoTimestamps: {},
          };

          await saveStoredProfile(nextProfile);
          setProfile(nextProfile);
          setFaceUri('');
          setLeftPalmUri('');
          setRightPalmUri('');
          setHandwritingUri('');
          setFaceUpdatedAt('');
          setLeftPalmUpdatedAt('');
          setRightPalmUpdatedAt('');
          setHandwritingUpdatedAt('');
          Alert.alert('Photos deleted', 'Your profile details are still saved.');
        },
      },
    ]);
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.copy}>
          {profile.westernZodiac} and {profile.chineseZodiac}. LuckyDay stays local for now.
        </Text>
      </Card>

      <View style={styles.form}>
        <Field label="Nickname" value={nickname} onChangeText={setNickname} placeholder="Mali" />
        <Field label="Birthday" value={birthday} onChangeText={setBirthday} placeholder="YYYY-MM-DD" />

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
      </View>

      <View style={styles.photoStack}>
        <Text style={styles.photoTitle}>Optional luck photos</Text>
        <Text style={styles.photoCopy}>Add, retake, or remove photos anytime. Photo links are saved locally and are not encrypted in this MVP.</Text>
        <ProfilePhotoCapture
          label="Face"
          hint="Take a clear photo in soft light."
          value={faceUri}
          onChange={(uri) => updatePhoto(uri, setFaceUri, setFaceUpdatedAt)}
          onRemove={() => removePhoto(setFaceUri, setFaceUpdatedAt)}
          updatedAt={faceUpdatedAt}
          cameraType={ImagePicker.CameraType.front}
        />
        <ProfilePhotoCapture
          label="Left palm"
          hint="Open your left hand and show the full palm."
          value={leftPalmUri}
          onChange={(uri) => updatePhoto(uri, setLeftPalmUri, setLeftPalmUpdatedAt)}
          onRemove={() => removePhoto(setLeftPalmUri, setLeftPalmUpdatedAt)}
          updatedAt={leftPalmUpdatedAt}
        />
        <ProfilePhotoCapture
          label="Right palm"
          hint="Open your right hand and show the full palm."
          value={rightPalmUri}
          onChange={(uri) => updatePhoto(uri, setRightPalmUri, setRightPalmUpdatedAt)}
          onRemove={() => removePhoto(setRightPalmUri, setRightPalmUpdatedAt)}
          updatedAt={rightPalmUpdatedAt}
        />
        <ProfilePhotoCapture
          label="Handwriting"
          hint="Write: Today I choose steady luck. Then take a photo."
          value={handwritingUri}
          onChange={(uri) => updatePhoto(uri, setHandwritingUri, setHandwritingUpdatedAt)}
          onRemove={() => removePhoto(setHandwritingUri, setHandwritingUpdatedAt)}
          updatedAt={handwritingUpdatedAt}
        />
      </View>

      <Card style={styles.privacyCard}>
        <Text style={styles.photoTitle}>Privacy controls</Text>
        <Text style={styles.photoCopy}>
          Your profile, photo links, and feedback are stored on this device for the MVP. AsyncStorage is local, but it is not encrypted.
        </Text>
        <View style={styles.privacyActions}>
          <AppButton label="Clear feedback" variant="secondary" onPress={confirmClearFeedback} />
          <AppButton label="Delete photos only" variant="secondary" onPress={confirmDeletePhotosOnly} />
          <AppButton label="Delete all local data" variant="danger" onPress={confirmDeleteLocalData} />
        </View>
      </Card>

      <AppButton label="Save settings" onPress={saveSettings} />
      <AppButton label="Reset profile" variant="danger" onPress={confirmReset} />
    </Screen>
  );
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

function removePhoto(setUri: (uri: string) => void, setUpdatedAt: (value: string) => void) {
  setUri('');
  setUpdatedAt('');
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
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.panelStrong,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  photoStack: {
    gap: spacing.md,
  },
  photoTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  photoCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  privacyCard: {
    gap: spacing.md,
  },
  privacyActions: {
    gap: spacing.sm,
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
    backgroundColor: colors.ink,
    borderColor: colors.ink,
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
