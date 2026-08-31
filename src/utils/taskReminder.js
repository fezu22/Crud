/**
 * Pure task reminder helpers.
 * This file has no React or native dependencies, so each function can be copied
 * into another JavaScript project and tested independently.
 */

export function toLocalDateValue(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function toLocalTimeValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatTaskTime(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return '';
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function combineDateAndTime(dateValue, timeValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || '')) return null;
  if (!/^\d{2}:\d{2}$/.test(timeValue || '')) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  if (hour > 23 || minute > 59) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  const matchesInput =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;
  return matchesInput ? date : null;
}

export function createReminderAt(
  dateValue,
  timeValue,
  minimumLeadMinutes = 2,
  now = Date.now(),
) {
  if (!timeValue) return { value: null, error: '' };
  const selected = combineDateAndTime(dateValue, timeValue);
  if (!selected) {
    return { value: null, error: 'Select a valid date and time.' };
  }
  if (selected.getTime() <= now + minimumLeadMinutes * 60000) {
    return {
      value: null,
      error: `Choose a time at least ${minimumLeadMinutes} minutes from now.`,
    };
  }
  return { value: selected.toISOString(), error: '' };
}
