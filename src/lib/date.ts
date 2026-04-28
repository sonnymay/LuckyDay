export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && todayKey(date) === value;
}
