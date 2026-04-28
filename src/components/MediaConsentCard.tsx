import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
};

export function MediaConsentCard({ accepted, onChange }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo privacy</Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => onChange(!accepted)}
          style={[styles.checkbox, accepted && styles.checked]}
        >
          {accepted ? <Text style={styles.checkmark}>OK</Text> : null}
        </Pressable>
      </View>
      <Text style={styles.copy}>
        LuckyDay uses your face, palm, and handwriting photos only for your local profile in this MVP. They stay on this device unless you choose cloud sync in a future version.
      </Text>
      <Pressable onPress={() => onChange(!accepted)} style={styles.consentRow}>
        <Text style={styles.consentText}>I understand and agree to save these photos on this device.</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panelStrong,
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  checked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  checkmark: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  consentRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  consentText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});
