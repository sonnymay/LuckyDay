import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  value: string; // HH:mm (24-hour)
  onChange: (value: string) => void;
};

export function TimePickerInput({ value, onChange }: Props) {
  const [hour, setHour] = useState(() => value.slice(0, 2));
  const [minute, setMinute] = useState(() => value.slice(3, 5));

  const minuteRef = useRef<TextInput>(null);

  // Sync when parent loads value asynchronously (e.g. Settings loading from storage)
  useEffect(() => {
    if (value && value.length >= 5) {
      setHour(value.slice(0, 2));
      setMinute(value.slice(3, 5));
    }
  }, [value]);

  function handleHour(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2);
    setHour(clean);
    onChange(`${clean.padStart(2, '0')}:${minute.padStart(2, '0')}`);
    if (clean.length === 2) minuteRef.current?.focus();
  }

  function handleMinute(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2);
    setMinute(clean);
    onChange(`${hour.padStart(2, '0')}:${clean.padStart(2, '0')}`);
  }

  return (
    <View style={styles.row}>
      <View style={styles.segment}>
        <TextInput
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={handleHour}
          placeholder="HH"
          placeholderTextColor={colors.faint}
          style={styles.input}
          value={hour}
        />
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={styles.segment}>
        <TextInput
          ref={minuteRef}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={handleMinute}
          placeholder="MM"
          placeholderTextColor={colors.faint}
          style={styles.input}
          value={minute}
        />
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>24-hr</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
  },
  input: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  colon: {
    color: colors.muted,
    fontSize: 26,
    fontWeight: '900',
  },
  badge: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.goldDeep,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
