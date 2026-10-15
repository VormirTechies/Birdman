import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid calendar date');

export const calendarChangesSchema = z.strictObject({
  maxCapacity: z.number().int().min(0).max(200).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).optional(),
  isOpen: z.boolean().optional(),
}).refine((settings) => Object.values(settings).some((value) => value !== undefined),
  'Select at least one setting to change');

const scopeSchema = z.strictObject({ startDate: dateSchema, endDate: dateSchema });

export const calendarSettingsRequestSchema = z.strictObject({
  applyMode: z.enum(['all_days', 'one_day', 'date_range']),
  date: dateSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  settings: calendarChangesSchema,
  scope: scopeSchema.optional(),
  // Compatibility for older clients; attribution always comes from the verified token.
  adminId: z.string().optional(),
}).superRefine((input, context) => {
  if (input.applyMode === 'one_day' && !input.date) {
    context.addIssue({ code: 'custom', path: ['date'], message: 'Please select a date' });
  }
  if (input.applyMode === 'date_range') {
    if (!input.startDate || !input.endDate) {
      context.addIssue({ code: 'custom', path: ['startDate'], message: 'Please select start and end dates' });
    } else if (input.startDate > input.endDate) {
      context.addIssue({ code: 'custom', path: ['endDate'], message: 'Start date must be before end date' });
    }
  }
});

export type CalendarSettingsRequest = z.infer<typeof calendarSettingsRequestSchema>;
export type CalendarScope = z.infer<typeof scopeSchema>;

export function resolveCalendarScope(input: CalendarSettingsRequest, today: string, applying = false): CalendarScope {
  let scope: CalendarScope;
  if (input.applyMode === 'all_days') {
    if (applying && !input.scope) throw new Error('Preview the booking window before applying changes');
    const startDate = input.scope?.startDate ?? today;
    const end = new Date(`${startDate}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 180);
    scope = { startDate, endDate: end.toISOString().slice(0, 10) };
  } else if (input.applyMode === 'one_day') {
    scope = { startDate: input.date!, endDate: input.date! };
  } else {
    scope = { startDate: input.startDate!, endDate: input.endDate! };
  }
  if (input.scope && (input.scope.startDate !== scope.startDate || input.scope.endDate !== scope.endDate)) {
    throw new Error('Date scope changed. Preview the changes again');
  }
  return scope;
}

export function calendarScopeDates(scope: CalendarScope): string[] {
  const dates: string[] = [];
  const date = new Date(`${scope.startDate}T00:00:00Z`);
  const end = new Date(`${scope.endDate}T00:00:00Z`);
  for (; date <= end; date.setUTCDate(date.getUTCDate() + 1)) dates.push(date.toISOString().slice(0, 10));
  return dates;
}
