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
        <View style={styles.iconBubble}>
          <Text style={styles.icon}>🔒</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Photo privacy</Text>
          <Text style={styles.subtitle}>Private by default</Text>
        </View>
      </View>
      <Text style={styles.copy}>
        Photos are optional. If you add face, palm, or handwriting photos, LuckyDay saves them only on this device. You can delete them anytime.
      </Text>
      <View style={styles.trustPills}>
        <Text style={styles.trustPill}>Never uploaded</Text>
        <Text style={styles.trustPill}>No account needed</Text>
        <Text style={styles.trustPill}>Delete anytime</Text>
      </View>
      {/* Toggle sits immediately next to the consent sentence — no visual separation. */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => onChange(!accepted)}
        style={styles.consentRow}
      >
        <View style={[styles.checkbox, accepted && styles.checked]}>
          {accepted ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.consentText}>I agree to save optional photos on this device.</Text>
      </Pressable>
    </Card>
  );
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
    justifyContent: 'space-between',
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
  headerCopy: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.goldDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.roseGold,
    borderRadius: 16,
    borderWidth: 1.5,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checked: {
    backgroundColor: colors.luckyGold,
    borderColor: colors.goldDeep,
  },
  checkmark: {
    color: colors.goldDeep,
    fontSize: 17,
    fontWeight: '900',
  },
  trustPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trustPill: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  consentRow: {
    alignItems: 'center',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  consentText: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
});
