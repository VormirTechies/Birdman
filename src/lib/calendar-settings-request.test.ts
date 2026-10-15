import { describe, expect, it } from 'vitest';
import { calendarSettingsRequestSchema, calendarScopeDates, resolveCalendarScope } from './calendar-settings-request';

describe('calendar settings request', () => {
  const base = { applyMode: 'one_day', date: '2026-10-16' };
  it.each([{ maxCapacity: 0 }, { isOpen: false }, { startTime: '00:00:00' }, { maxCapacity: 200 }])('accepts only selected values including zero/false: %j', settings => {
    expect(calendarSettingsRequestSchema.parse({ ...base, settings }).settings).toEqual(settings);
  });
  it.each([{}, { maxCapacity: -1 }, { maxCapacity: 201 }, { maxCapacity: 2.5 }, { isOpen: 'false' },
    { startTime: '25:00:00' }, { startTime: '16:60:00' }, { unknown: true }, { maxCapacity: 10, updatedBy: 'injected' }])('rejects invalid changes %j', settings => {
    expect(calendarSettingsRequestSchema.safeParse({ ...base, settings }).success).toBe(false);
  });
  it.each(['2026-02-30', '2026-13-01', 'not-a-date'])('rejects non-calendar dates %s', date => {
    expect(calendarSettingsRequestSchema.safeParse({ ...base, date, settings: { isOpen: true } }).success).toBe(false);
  });
  it('rejects a reversed range', () => {
    expect(calendarSettingsRequestSchema.safeParse({ applyMode: 'date_range', startDate: '2026-10-17', endDate: '2026-10-16', settings: { isOpen: true } }).success).toBe(false);
  });
  it('resolves the inclusive horizon and handles year boundaries', () => {
    const input = calendarSettingsRequestSchema.parse({ applyMode: 'all_days', settings: { maxCapacity: 80 } });
    const scope = resolveCalendarScope(input, '2026-10-16');
    const dates = calendarScopeDates(scope);
    expect(dates).toHaveLength(181);
    expect(dates[0]).toBe('2026-10-16');
    expect(dates.at(-1)).toBe('2027-04-14');
    expect(resolveCalendarScope({ ...input, scope }, '2026-10-17', true)).toEqual(scope);
  });
  it('includes leap day exactly once', () => {
    expect(calendarScopeDates({ startDate: '2028-02-28', endDate: '2028-03-01' })).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
  });
});
