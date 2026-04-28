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
import { getStoredProfile, resetStoredProfile, saveStoredProfile } from '../src/lib/storage';
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

    if (!faceUri || !leftPalmUri || !rightPalmUri || !handwritingUri) {
      Alert.alert('Photos needed', 'Keep your face, left palm, right palm, and handwriting photos on your profile.');
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
        <Text style={styles.photoTitle}>Luck photos</Text>
        <Text style={styles.photoCopy}>Retake any setup photo when your profile needs a refresh.</Text>
        <ProfilePhotoCapture
          label="Face"
          hint="Take a clear photo in soft light."
          value={faceUri}
          onChange={setFaceUri}
          cameraType={ImagePicker.CameraType.front}
        />
        <ProfilePhotoCapture
          label="Left palm"
          hint="Open your left hand and show the full palm."
          value={leftPalmUri}
          onChange={setLeftPalmUri}
        />
        <ProfilePhotoCapture
          label="Right palm"
          hint="Open your right hand and show the full palm."
          value={rightPalmUri}
          onChange={setRightPalmUri}
        />
        <ProfilePhotoCapture
          label="Handwriting"
          hint="Write one short sentence on paper and take a photo."
          value={handwritingUri}
          onChange={setHandwritingUri}
        />
      </View>

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
