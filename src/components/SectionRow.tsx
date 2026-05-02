import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../styles/theme';

type Props = {
  label: string;
  value: string;
};

export function SectionRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  label: {
    color: colors.mauve,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 25,
  },
});
