import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from './Card';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  label: string;
  hint: string;
  value: string;
  onChange: (uri: string) => void;
  cameraType?: ImagePicker.CameraType;
};

export function ProfilePhotoCapture({ label, hint, value, onChange, cameraType = ImagePicker.CameraType.back }: Props) {
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

  return (
    <Card style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      {value ? <Image source={{ uri: value }} style={styles.preview} /> : <View style={styles.emptyPreview} />}

      <Pressable onPress={capture} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>{value ? 'Retake photo' : 'Take photo'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
  label: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: colors.ink,
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
});
