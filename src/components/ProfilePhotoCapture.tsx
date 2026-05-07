import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

async function triggerCaptureHaptic() {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // expo-haptics not installed — no-op
  }
}
import { Card } from './Card';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  hint: string;
  value: string;
  onChange: (uri: string) => void;
  onRemove?: () => void;
  updatedAt?: string;
  cameraType?: 'front' | 'back';
};

export function ProfilePhotoCapture({
  label,
  hint,
  value,
  onChange,
  onRemove,
  updatedAt,
  cameraType = 'back',
}: Props) {
  const placeholder = getPhotoPlaceholder(label);

  async function capture() {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'LuckyDay needs the camera to take this setup photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      cameraType: cameraType === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      quality: 0.75,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
      triggerCaptureHaptic();
    }
  }

  function confirmRemove() {
    if (!onRemove) {
      return;
    }

    Alert.alert(`Remove ${label.toLowerCase()} photo?`, 'You can retake it before saving your profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemove },
    ]);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBubble}>
          <Text style={styles.icon}>{placeholder.icon}</Text>
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.status, value ? styles.completeStatus : styles.neededStatus]}>
              {value ? 'Captured' : 'Optional'}
            </Text>
          </View>
          <Text style={styles.hint}>{hint}</Text>
          {value && updatedAt ? <Text style={styles.updatedAt}>Updated {formatUpdatedAt(updatedAt)}</Text> : null}
        </View>
      </View>

      {value ? (
        <Image source={{ uri: value }} style={styles.preview} />
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyIcon}>{placeholder.icon}</Text>
          <View>
            <Text style={styles.emptyTitle}>{placeholder.title}</Text>
            <Text style={styles.emptyCopy}>{placeholder.copy}</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={capture} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{value ? 'Retake photo' : 'Take photo'}</Text>
        </Pressable>
        {value && onRemove ? (
          <Pressable onPress={confirmRemove} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPhotoPlaceholder(label: string) {
  if (label.toLowerCase().includes('face')) {
    return {
      icon: '🌸',
      title: 'Soft light portrait',
      copy: 'A calm, clear photo works best.',
    };
  }

  if (label.toLowerCase().includes('palm')) {
    return {
      icon: '🖐️',
      title: 'Open palm',
      copy: 'Show the full hand, wrist to fingertips.',
    };
  }

  return {
    icon: '✍️',
    title: 'Handwritten note',
    copy: 'A short line in your natural writing.',
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.roseGold,
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  label: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  status: {
    borderRadius: radii.pill,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  completeStatus: {
    backgroundColor: '#D8F1E6',
    color: colors.green,
  },
  neededStatus: {
    backgroundColor: colors.champagne,
    color: colors.goldDeep,
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  updatedAt: {
    color: colors.faint,
    fontSize: 13,
    fontWeight: '700',
  },
  preview: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.panelStrong,
    borderRadius: radii.md,
    width: '100%',
  },
  emptyPreview: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.roseGold,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  emptyIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  emptyTitle: {
    color: colors.mauve,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.mauve,
    borderRadius: radii.pill,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: colors.pink,
    borderRadius: radii.pill,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  removeButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
});
