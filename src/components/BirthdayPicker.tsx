import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
};

export function BirthdayPicker({ value, onChange }: Props) {
  const [year, setYear] = useState(() => value.slice(0, 4));
  const [month, setMonth] = useState(() => value.slice(5, 7));
  const [day, setDay] = useState(() => value.slice(8, 10));

  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);

  // Sync when parent loads value asynchronously (e.g. Settings loading from storage)
  useEffect(() => {
    if (value && value.length >= 10) {
      setYear(value.slice(0, 4));
      setMonth(value.slice(5, 7));
      setDay(value.slice(8, 10));
    }
  }, [value]);

  function assemble(y: string, m: string, d: string) {
    onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }

  function handleYear(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    setYear(clean);
    assemble(clean, month, day);
    if (clean.length === 4) monthRef.current?.focus();
  }

  function handleMonth(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2);
    setMonth(clean);
    assemble(year, clean, day);
    if (clean.length === 2) dayRef.current?.focus();
  }

  function handleDay(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2);
    setDay(clean);
    assemble(year, month, clean);
  }

  return (
    <View style={styles.row}>
      <View style={[styles.segment, styles.yearSegment]}>
        <TextInput
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={handleYear}
          placeholder="YYYY"
          placeholderTextColor={colors.faint}
          style={styles.input}
          value={year}
        />
      </View>
      <Text style={styles.sep}>–</Text>
      <View style={styles.segment}>
        <TextInput
          ref={monthRef}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={handleMonth}
          placeholder="MM"
          placeholderTextColor={colors.faint}
          style={styles.input}
          value={month}
        />
      </View>
      <Text style={styles.sep}>–</Text>
      <View style={styles.segment}>
        <TextInput
          ref={dayRef}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={handleDay}
          placeholder="DD"
          placeholderTextColor={colors.faint}
          style={styles.input}
          value={day}
        />
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
  yearSegment: {
    flex: 2,
  },
  input: {
    color: colors.ink,
    fontSize: 17,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  sep: {
    color: colors.faint,
    fontSize: 20,
    fontWeight: '900',
  },
});
