import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
};

const itemHeight = 42;
/** Snap interval: item height + gap between items. Must match scrollContent gap. */
const ITEM_STEP = itemHeight + spacing.xs; // 48
const DEFAULT_BIRTHDAY = '1990-01-01';

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
  // Default to a complete date so first-time users are never blocked by invisible
  // missing month/day state. They can still adjust any column before continuing.
  const initialValue = value || DEFAULT_BIRTHDAY;
  const [selectedYear, setSelectedYear] = useState(() => initialValue.slice(0, 4));
  const [selectedMonth, setSelectedMonth] = useState(() => initialValue.slice(5, 7));
  const [selectedDay, setSelectedDay] = useState(() => initialValue.slice(8, 10));
  const years = useMemo(() => buildYears(), []);
  const days = useMemo(() => buildDays(selectedYear, selectedMonth), [selectedMonth, selectedYear]);
  const selectedMonthLabel = months.find((month) => month.value === selectedMonth)?.label;

  useEffect(() => {
    if (!value) {
      setSelectedYear('1990');
      setSelectedMonth('01');
      setSelectedDay('01');
      onChange(DEFAULT_BIRTHDAY);
      return;
    }

    if (value.length >= 10) {
      setSelectedYear(value.slice(0, 4));
      setSelectedMonth(value.slice(5, 7));
      setSelectedDay(value.slice(8, 10));
    }
  }, [onChange, value]);

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

  const hasCompleteDate = Boolean(selectedYear && selectedMonthLabel && selectedDay);

  return (
    <View style={styles.wrapper}>
      {!hasCompleteDate ? (
        <Text style={styles.help}>Tap to pick your year, month, and day.</Text>
      ) : null}
      <View style={styles.columns}>
        <WheelColumn
          accessibilityLabel="Birth year"
          label="Year"
          items={years.map((year) => ({ label: year, value: year }))}
          onSelect={(year) => update({ year })}
          selectedValue={selectedYear}
        />
        <WheelColumn
          accessibilityLabel="Birth month"
          label="Month"
          items={months}
          onSelect={(month) => update({ month })}
          selectedValue={selectedMonth}
        />
        <WheelColumn
          accessibilityLabel="Birth day"
          label="Day"
          items={days.map((day) => ({ label: String(Number(day)), value: day }))}
          onSelect={(day) => update({ day })}
          selectedValue={selectedDay}
        />
      </View>
      {hasCompleteDate ? (
        <Text style={styles.selectedSummary}>
          Selected: {selectedMonthLabel} {Number(selectedDay)}, {selectedYear}
        </Text>
      ) : null}
    </View>
  );
}

function WheelColumn({
  accessibilityLabel,
  label,
  items,
  onSelect,
  selectedValue,
}: {
  accessibilityLabel: string;
  label: string;
  items: { label: string; value: string }[];
  onSelect: (value: string) => void;
  selectedValue: string;
}) {
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to the selected item whenever selectedValue or items change.
  // This keeps the visual position in sync with state on every render cycle.
  useEffect(() => {
    const index = items.findIndex((item) => item.value === selectedValue);
    if (index < 0) return;
    // Defer one frame to ensure layout has completed before scrolling.
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: index * ITEM_STEP, animated: false });
    }, 0);
  }, [selectedValue, items]);

  function handlePress(value: string) {
    // Scroll the column so the tapped item is visually at the top of the viewport,
    // then update state. This keeps the highlight and the "Selected:" bar in sync.
    const index = items.findIndex((item) => item.value === value);
    if (index >= 0) {
      scrollRef.current?.scrollTo({ y: index * ITEM_STEP, animated: true });
    }
    onSelect(value);
  }

  function handleMomentumScrollEnd(e: { nativeEvent: { contentOffset: { y: number } } }) {
    // When the user finishes scrolling, snap-select the item nearest the top of the viewport.
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_STEP);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    if (items[clamped]?.value !== selectedValue) {
      onSelect(items[clamped].value);
    }
  }

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView
        ref={scrollRef}
        accessibilityLabel={accessibilityLabel}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_STEP}
      >
        {items.map((item) => {
          const selected = item.value === selectedValue;

          return (
            <Pressable
              accessibilityRole="button"
              key={item.value}
              onPress={() => handlePress(item.value)}
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
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
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
    width: '100%',
  },
  column: {
    flex: 1,
    maxHeight: itemHeight * 4,
    minWidth: 0,
    overflow: 'hidden',
  },
  columnLabel: {
    color: colors.mauve,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scrollContent: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
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
    borderWidth: 2,
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
  selectedSummary: {
    alignSelf: 'stretch',
    backgroundColor: colors.champagne,
    borderColor: colors.luckyGold,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.goldDeep,
    fontSize: 14,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  help: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
