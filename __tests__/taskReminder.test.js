import {
  combineDateAndTime,
  createReminderAt,
  formatTaskTime,
  toLocalDateValue,
} from '../src/utils/taskReminder';

const { normalizeOptionalDate } = require('../backend/utils/taskPayload');

describe('task reminder helpers', () => {
  test('keeps reminders optional', () => {
    expect(createReminderAt('2026-09-02', '')).toEqual({
      value: null,
      error: '',
    });
  });

  test('builds a future reminder without a one-day limit', () => {
    const now = new Date(2026, 7, 31, 12, 0).getTime();
    const result = createReminderAt('2026-09-03', '14:30', 2, now);
    expect(result.error).toBe('');
    expect(new Date(result.value).getTime()).toBeGreaterThan(now + 24 * 60 * 60000);
  });

  test('rejects invalid and too-close times', () => {
    expect(combineDateAndTime('2026-02-30', '10:00')).toBeNull();
    const now = new Date(2026, 7, 31, 12, 0).getTime();
    expect(createReminderAt('2026-08-31', '12:01', 2, now).error).toContain('2 minutes');
  });

  test('formats reusable date and time values', () => {
    expect(toLocalDateValue('2026-09-03T00:00:00.000Z')).toBe('2026-09-03');
    expect(formatTaskTime('14:30')).toBe('2:30 PM');
  });

  test('backend date validation returns a 400-ready error', () => {
    expect(() => normalizeOptionalDate('not-a-date', 'reminderAt')).toThrow(
      'reminderAt must be a valid date',
    );
    try {
      normalizeOptionalDate('not-a-date', 'reminderAt');
    } catch (error) {
      expect(error.statusCode).toBe(400);
    }
  });
});
