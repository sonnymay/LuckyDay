import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
};

const itemHeight = 42;
const months = [
  { label: 'Jan', value: '01' },
  { label: 'Feb', value: '02' },
  { label: 'Mar', value: '03' },
  { label: 'Apr', value: '04' },
  { label: 'May', value: '05' },
  { label: 'Jun', value: '06' },
  { label: 'Jul', value: '07' },
  { label: 'Aug', value: '08' },
  { label: 'Sep', value: '09' },
  { label: 'Oct', value: '10' },
  { label: 'Nov', value: '11' },
  { label: 'Dec', value: '12' },
];

export function BirthdayPicker({ value, onChange }: Props) {
  const [selectedYear, setSelectedYear] = useState(() => value.slice(0, 4));
  const [selectedMonth, setSelectedMonth] = useState(() => value.slice(5, 7));
  const [selectedDay, setSelectedDay] = useState(() => value.slice(8, 10));
  const years = useMemo(() => buildYears(), []);
  const days = useMemo(() => buildDays(selectedYear, selectedMonth), [selectedMonth, selectedYear]);

  useEffect(() => {
    if (!value) {
      setSelectedYear('');
      setSelectedMonth('');
      setSelectedDay('');
      return;
    }

    if (value.length >= 10) {
      setSelectedYear(value.slice(0, 4));
      setSelectedMonth(value.slice(5, 7));
      setSelectedDay(value.slice(8, 10));
    }
  }, [value]);

  function update(next: { year?: string; month?: string; day?: string }) {
    const year = next.year ?? selectedYear;
    const month = next.month ?? selectedMonth;
    const maxDay = getDaysInMonth(year, month);
    const rawDay = next.day ?? selectedDay;
    const day = rawDay && Number(rawDay) > maxDay ? String(maxDay).padStart(2, '0') : rawDay;

    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);

    if (year && month && day) {
      onChange(`${year}-${month}-${day}`);
      return;
    }

    onChange('');
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.columns}>
        <WheelColumn
          accessibilityLabel="Birth year"
          items={years.map((year) => ({ label: year, value: year }))}
          onSelect={(year) => update({ year })}
          selectedValue={selectedYear}
        />
        <WheelColumn
          accessibilityLabel="Birth month"
          items={months}
          onSelect={(month) => update({ month })}
          selectedValue={selectedMonth}
        />
        <WheelColumn
          accessibilityLabel="Birth day"
          items={days.map((day) => ({ label: String(Number(day)), value: day }))}
          onSelect={(day) => update({ day })}
          selectedValue={selectedDay}
        />
      </View>
      <Text style={styles.help}>Scroll and tap your birthday.</Text>
    </View>
  );
}

function WheelColumn({
  accessibilityLabel,
  items,
  onSelect,
  selectedValue,
}: {
  accessibilityLabel: string;
  items: { label: string; value: string }[];
  onSelect: (value: string) => void;
  selectedValue: string;
}) {
  return (
    <View style={styles.column}>
      <ScrollView
        accessibilityLabel={accessibilityLabel}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
      >
        {items.map((item) => {
          const selected = item.value === selectedValue;

          return (
            <Pressable
              accessibilityRole="button"
              key={item.value}
              onPress={() => onSelect(item.value)}
              style={[styles.item, selected && styles.selectedItem]}
            >
              <Text style={[styles.itemText, selected && styles.selectedItemText]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function buildYears() {
  const latestYear = new Date().getFullYear() - 13;
  const earliestYear = 1924;
  const years: string[] = [];

  for (let year = latestYear; year >= earliestYear; year -= 1) {
    years.push(String(year));
  }

  return years;
}

function buildDays(year: string, month: string) {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, index) => String(index + 1).padStart(2, '0'));
}

function getDaysInMonth(year: string, month: string) {
  const numericYear = Number(year) || 2000;
  const numericMonth = Number(month) || 1;
  return new Date(numericYear, numericMonth, 0).getDate();
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  columns: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  column: {
    flex: 1,
    maxHeight: itemHeight * 4,
  },
  scrollContent: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  item: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: itemHeight,
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderWidth: 1,
  },
  itemText: {
    color: colors.faint,
    fontSize: 16,
    fontWeight: '800',
  },
  selectedItemText: {
    color: colors.goldDeep,
    fontSize: 18,
    fontWeight: '900',
  },
  help: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
