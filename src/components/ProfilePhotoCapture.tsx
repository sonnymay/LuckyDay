import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from './Card';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  hint: string;
  value: string;
  onChange: (uri: string) => void;
  onRemove?: () => void;
  updatedAt?: string;
  cameraType?: ImagePicker.CameraType;
};

export function ProfilePhotoCapture({
  label,
  hint,
  value,
  onChange,
  onRemove,
  updatedAt,
  cameraType = ImagePicker.CameraType.back,
}: Props) {
  async function capture() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'LuckyDay needs the camera to take this setup photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      cameraType,
      quality: 0.75,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
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

      {value ? <Image source={{ uri: value }} style={styles.preview} /> : <View style={styles.emptyPreview} />}

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

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  copy: {
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
    backgroundColor: colors.pink,
    color: colors.red,
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
    aspectRatio: 4 / 3,
    backgroundColor: colors.panelStrong,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    width: '100%',
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
