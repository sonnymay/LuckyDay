import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../src/components/AppButton';
import { BirthdayPicker } from '../src/components/BirthdayPicker';
import { Card } from '../src/components/Card';
import { ProfilePhotoCapture } from '../src/components/ProfilePhotoCapture';
import { Screen } from '../src/components/Screen';
import { TimePickerInput } from '../src/components/TimePickerInput';
import { isValidDateKey } from '../src/lib/date';
import { elementEmoji, getZodiacElement } from '../src/lib/chineseZodiac';
import { createProfile, getChineseZodiac, normalizeMainFocuses } from '../src/lib/luck';
import { isValidReminderTime, syncLocalDailyReminder } from '../src/lib/notifications';
import { getPremiumStatus, PremiumStatus } from '../src/lib/purchases';
import { getStoredProfile, resetAllStoredData, resetStoredFeedback, resetStoredProfile, saveStoredProfile } from '../src/lib/storage';
import { colors, fonts, radii, spacing } from '../src/styles/theme';
import { MainFocus, Profile } from '../src/types';

const focusOptions: MainFocus[] = ['Money', 'Love', 'Work', 'Health', 'Luck'];
const focusEmoji: Record<MainFocus, string> = {
  Money: '💰',
  Love: '💗',
  Work: '📌',
  Health: '🌿',
  Luck: '🍀',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius: 12, backgroundColor: colors.roseGold, opacity }, style]}
    />
  );
}

function SettingsSkeleton() {
  return (
    <View style={styles.skeletonScreen}>
      <SkeletonBlock width="100%" height={90} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={80} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="100%" height={120} style={{ borderRadius: 20 }} />
      <SkeletonBlock width="70%" height={54} style={{ borderRadius: 12 }} />
      <SkeletonBlock width="100%" height={54} style={{ borderRadius: 12 }} />
      <SkeletonBlock width="100%" height={100} style={{ borderRadius: 20 }} />
    </View>
  );
}

// ─── Lazy helpers ──────────────────────────────────────────────────────────────

async function requestStoreReviewIfAvailable() {
  try {
    const StoreReview = await import('expo-store-review');
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) await StoreReview.requestReview();
  } catch {
    // Not available on this platform or package not installed
  }
}

// ─── Screen ────────────────────────────────────────────────────────────────────

async function triggerSuccessHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
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
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const saveAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Promise.all([getStoredProfile(), getPremiumStatus()]).then(([storedProfile, status]) => {
        if (!storedProfile) {
          router.replace('/');
          return;
        }

        setProfile(storedProfile);
        setPremiumStatus(status);
        setNickname(storedProfile.nickname);
        setBirthday(storedProfile.birthday);
        setBirthTime(storedProfile.birthTime ?? '');
        setBirthplace(storedProfile.birthplace ?? '');
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
      Alert.alert('Birthday needed', 'Fill in a valid year, month, and day.');
      return;
    }

    if (mainFocus.length === 0) {
      Alert.alert('Main focus needed', 'Choose at least one focus for your daily reading.');
      return;
    }

    if (!isValidReminderTime(notificationTime.trim())) {
      Alert.alert('Reminder time', 'Use a 24-hour time like 08:00.');
      return;
    }

    const nextProfile = {
      ...createProfile({
        nickname,
        birthday,
        birthTime: birthTime.trim(),
        birthplace: birthplace.trim(),
        mainFocus,
        notificationTime,
        photos: { faceUri, leftPalmUri, rightPalmUri, handwritingUri },
        photoTimestamps: { faceUpdatedAt, leftPalmUpdatedAt, rightPalmUpdatedAt, handwritingUpdatedAt },
        mediaConsentAt: profile.mediaConsentAt,
      }),
      id: profile.id,
      createdAt: profile.createdAt,
    };

    await saveStoredProfile(nextProfile);
    const reminderResult = await syncLocalDailyReminder(notificationTime);
    if (reminderResult === 'denied') {
      Alert.alert('Reminder not enabled', 'Notifications are off. You can allow them later in your device settings.');
    }

    triggerSuccessHaptic();
    setSaveConfirmed(true);
    saveAnim.setValue(0);
    Animated.timing(saveAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => router.replace('/home'), 1000);
  }

  function confirmReset() {
    Alert.alert('Reset profile?', 'This clears your local profile on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetStoredProfile();
          await syncLocalDailyReminder();
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
          await syncLocalDailyReminder();
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
            photos: { faceUri: '', leftPalmUri: '', rightPalmUri: '', handwritingUri: '' },
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

  if (!profile || premiumStatus === null) {
    return <SettingsSkeleton />;
  }

  const currentChineseZodiac = getChineseZodiac(profile.birthday);
  const zodiacElement = getZodiacElement(currentChineseZodiac, profile.birthday);
  const elementDisplay = zodiacElement ? `${elementEmoji[zodiacElement]} ${zodiacElement} Element` : '';

  return (
    <Screen showTabBar>
      {/* ── Page title ── */}
      <Text style={styles.pageTitle}>Profile ✨</Text>
      {/* ── Astrology ID Badge ── */}
      <Card style={styles.idBadgeCard}>
        <View style={styles.idBadgeHeader}>
          <View style={styles.idBadgeAvatar}>
            <Text style={styles.idBadgeAvatarEmoji}>✨</Text>
          </View>
          <View style={styles.idBadgeIdentity}>
            <Text style={styles.idBadgeName}>{profile.nickname}</Text>
            <Text style={styles.idBadgeLabel}>LUCKYDAY ID</Text>
          </View>
        </View>
        <View style={styles.idBadgeMetrics}>
          <View style={styles.idBadgeMetric}>
            <Text style={styles.idBadgeMetricValue}>{profile.westernZodiac}</Text>
            <Text style={styles.idBadgeMetricLabel}>WESTERN</Text>
          </View>
          <View style={styles.idBadgeDivider} />
          <View style={styles.idBadgeMetric}>
            <Text style={styles.idBadgeMetricValue}>{currentChineseZodiac}</Text>
            <Text style={styles.idBadgeMetricLabel}>CHINESE</Text>
          </View>
          {zodiacElement ? (
            <>
              <View style={styles.idBadgeDivider} />
              <View style={styles.idBadgeMetric}>
                <Text style={styles.idBadgeMetricValue}>{zodiacElement}</Text>
                <Text style={styles.idBadgeMetricLabel}>ELEMENT</Text>
              </View>
            </>
          ) : null}
        </View>
      </Card>

      {/* ── Subscription status ── */}
      {premiumStatus.isPremium ? (
        <Card style={styles.premiumStatusCard}>
          <View style={styles.premiumStatusRow}>
            <Text style={styles.premiumStatusEmoji}>✨</Text>
            <View style={styles.premiumStatusCopy}>
              <Text style={styles.premiumStatusTitle}>LuckyDay Premium</Text>
              <Text style={styles.premiumStatusSub}>
                {premiumStatus.expiresAt
                  ? `Renews ${premiumStatus.expiresAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : 'Active — thank you for supporting LuckyDay!'}
              </Text>
            </View>
          </View>
        </Card>
      ) : (
        <Pressable onPress={() => router.push('/paywall')} style={({ pressed }) => [styles.upgradeCard, pressed && styles.upgradeCardPressed]}>
          <Text style={styles.upgradeEmoji}>🌟</Text>
          <View style={styles.upgradeCopy}>
            <Text style={styles.upgradeTitle}>You're on Free</Text>
            <Text style={styles.upgradeSub}>Upgrade for full rituals, deeper history, and more.</Text>
          </View>
          <Text style={styles.upgradeArrow}>›</Text>
        </Pressable>
      )}

      {/* ── How it works ── */}
      <Card style={styles.howItWorksCard}>
        <Text style={styles.photoTitle}>How LuckyDay works</Text>
        <Text style={styles.photoCopy}>
          Your reading blends your birthday-based Chinese zodiac, your chosen focuses, Chinese almanac guidance, and local daily timing patterns. It is a gentle ritual guide, not a guarantee.
        </Text>
      </Card>

      {/* ── Form ── */}
      <View style={styles.form}>
        <Field label="Nickname" value={nickname} onChangeText={setNickname} placeholder="Mali" />
        <View style={styles.group}>
          <Text style={styles.label}>Birthday</Text>
          <BirthdayPicker value={birthday} onChange={setBirthday} />
        </View>
        <Field label="Birth time (optional)" value={birthTime} onChangeText={setBirthTime} placeholder="e.g. 14:30 or 2:30 PM" />
        <Field label="Birthplace (optional)" value={birthplace} onChangeText={setBirthplace} placeholder="e.g. London, UK" />

        <View style={styles.group}>
          <Text style={styles.label}>Main focuses</Text>
          <View style={styles.chips}>
            {focusOptions.map((focus) => (
              <Pressable
                key={focus}
                onPress={() => setMainFocus((current) => toggleFocus(current, focus))}
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
          <Text style={styles.label}>Morning reminder optional</Text>
          <TimePickerInput value={notificationTime} onChange={setNotificationTime} />
          <Text style={styles.helpText}>Leave empty to skip reminders.</Text>
        </View>
      </View>

      {/* ── Optional photos ── */}
      <View style={styles.photoStack}>
        <Text style={styles.photoTitle}>Optional luck photos 🍀</Text>
        <Text style={styles.photoCopy}>Add, retake, or remove photos anytime. Photo links are saved on this device and are not encrypted.</Text>
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

      {/* ── Quick actions ── */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.photoTitle}>Share & support 🌸</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [styles.quickActionButton, pressed && styles.quickActionPressed]}
            onPress={() => requestStoreReviewIfAvailable()}
          >
            <Text style={styles.quickActionEmoji}>⭐</Text>
            <Text style={styles.quickActionLabel}>Rate LuckyDay</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickActionButton, pressed && styles.quickActionPressed]}
            onPress={() =>
              Share.share({
                message: "I've been using LuckyDay for my daily luck ritual ✨ Check it out!",
                title: 'LuckyDay — your daily luck ritual',
              })
            }
          >
            <Text style={styles.quickActionEmoji}>🔗</Text>
            <Text style={styles.quickActionLabel}>Share LuckyDay</Text>
          </Pressable>
        </View>
      </Card>

      {/* ── Privacy controls ── */}
      <Card style={styles.privacyCard}>
        <Text style={styles.photoTitle}>Privacy controls 🧿</Text>
        <Text style={styles.photoCopy}>
          Your profile, photo links, and feedback are stored on this device. Local storage is private to this app, but it is not encrypted.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Read Privacy Policy"
          onPress={() => router.push('/privacy')}
          style={({ pressed }) => [styles.privacyPolicyLink, pressed && styles.privacyPolicyLinkPressed]}
        >
          <Text style={styles.privacyPolicyText}>Read Privacy Policy</Text>
        </Pressable>
        <View style={styles.privacyActions}>
          <AppButton label="Clear feedback" variant="secondary" onPress={confirmClearFeedback} />
          <AppButton label="Delete photos only" variant="secondary" onPress={confirmDeletePhotosOnly} />
          <AppButton label="Delete all local data" variant="danger" onPress={confirmDeleteLocalData} />
        </View>
      </Card>

      <AppButton label="Save settings" onPress={saveSettings} />
      {saveConfirmed ? (
        <Animated.View style={[styles.saveConfirm, { opacity: saveAnim }]}>
          <Text style={styles.saveConfirmText}>✓ Settings saved</Text>
        </Animated.View>
      ) : null}
      <AppButton label="Reset profile" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toggleFocus(current: MainFocus[], focus: MainFocus) {
  if (current.includes(focus)) return current.filter((item) => item !== focus);
  return [...current, focus];
}

function updatePhoto(uri: string, setUri: (uri: string) => void, setUpdatedAt: (value: string) => void) {
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

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  skeletonScreen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  pageTitle: {
    color: colors.ink,
    fontFamily: fonts.heavy,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
    paddingHorizontal: spacing.xs,
  },
  idBadgeCard: {
    backgroundColor: colors.mauve,
    borderColor: colors.luckyGold,
    borderWidth: 2,
    ...Platform.select({
      web: { backgroundImage: `linear-gradient(135deg, ${colors.mauve} 0%, #A84878 100%)` }
    }),
  },
  idBadgeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  idBadgeAvatar: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 32,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  idBadgeAvatarEmoji: {
    fontSize: 32,
  },
  idBadgeIdentity: {
    flex: 1,
  },
  idBadgeName: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  idBadgeLabel: {
    color: colors.champagne,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  idBadgeMetrics: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.md,
    flexDirection: 'row',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  idBadgeMetric: {
    alignItems: 'center',
    flex: 1,
  },
  idBadgeMetricValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  idBadgeMetricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  idBadgeDivider: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 1,
  },
  // Premium status card
  premiumStatusCard: {
    backgroundColor: colors.mauve,
    borderColor: colors.roseGold,
  },
  premiumStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  premiumStatusEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  premiumStatusCopy: {
    flex: 1,
  },
  premiumStatusTitle: {
    color: colors.champagne,
    fontSize: 20,
    fontWeight: '900',
  },
  premiumStatusSub: {
    color: '#FCEEF1',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 2,
  },
  // Upgrade card (free users)
  upgradeCard: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  upgradeCardPressed: {
    opacity: 0.82,
  },
  upgradeEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  upgradeCopy: {
    flex: 1,
  },
  upgradeTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  upgradeSub: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 2,
  },
  upgradeArrow: {
    color: colors.mauve,
    fontSize: 26,
    fontWeight: '900',
  },
  // How it works
  howItWorksCard: {
    backgroundColor: colors.lavender,
    borderColor: '#C8BFEE',
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
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
  // Quick actions
  quickActionsCard: {
    gap: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  quickActionPressed: {
    opacity: 0.78,
  },
  quickActionEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  quickActionLabel: {
    color: colors.mauve,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  // Privacy
  privacyCard: {
    gap: spacing.md,
  },
  privacyPolicyLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  privacyPolicyLinkPressed: {
    opacity: 0.75,
  },
  privacyPolicyText: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '900',
  },
  privacyActions: {
    gap: spacing.sm,
  },
  // Form fields
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
  // Save confirmation
  saveConfirm: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  saveConfirmText: {
    color: colors.jade,
    fontSize: 15,
    fontWeight: '900',
  },
});
