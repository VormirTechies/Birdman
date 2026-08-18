import type { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const BOOKING_SCHEMA_VERSION = 2 as const;
export const bookingStatuses = ['confirmed', 'cancelled', 'completed'] as const;
export const bookingSources = ['public', 'admin', 'migration'] as const;

export type BookingStatus = (typeof bookingStatuses)[number];
export type BookingSource = (typeof bookingSources)[number];

function isCalendarDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function normalizeBookingPhone(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizeBookingTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export const bookingDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(isCalendarDate, 'Enter a valid calendar date');

export const bookingTimeSchema = z
  .string()
  .trim()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Time must be in HH:mm or HH:mm:ss format')
  .transform(normalizeBookingTime);

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().toLowerCase().email('Enter a valid email address').max(254).optional()
);

const bookingCreationShape = {
  visitorName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .transform(normalizeBookingPhone)
    .pipe(z.string().min(10, 'Phone must contain at least 10 digits').max(15)),
  email: optionalEmailSchema,
  adults: z.number().int().min(1).max(10),
  children: z.number().int().min(0).max(10),
  bookingDate: bookingDateSchema,
  bookingTime: bookingTimeSchema,
};

function validateGuestTotal(
  value: { adults: number; children: number },
  context: z.RefinementCtx
) {
  if (value.adults + value.children > 10) {
    context.addIssue({
      code: 'custom',
      path: ['adults'],
      message: 'Total guests cannot exceed 10',
    });
  }
}

export const publicBookingSubmissionSchema = z
  .object({
    ...bookingCreationShape,
    website: z.string().max(200).optional(),
  })
  .strict()
  .superRefine(validateGuestTotal);

export const adminBookingCreationSchema = z
  .object(bookingCreationShape)
  .strict()
  .superRefine(validateGuestTotal);

export type PublicBookingSubmission = z.infer<typeof publicBookingSubmissionSchema>;
export type AdminBookingCreation = z.infer<typeof adminBookingCreationSchema>;

export const bookingMutationSchema = z
  .object({
    visitorName: z.string().trim().min(2).max(100).optional(),
    phone: z
      .string()
      .trim()
      .transform(normalizeBookingPhone)
      .pipe(z.string().min(10).max(15))
      .optional(),
    email: z.union([optionalEmailSchema, z.null()]).optional(),
    adults: z.number().int().min(1).max(10).optional(),
    children: z.number().int().min(0).max(10).optional(),
    bookingDate: bookingDateSchema.optional(),
    bookingTime: bookingTimeSchema.optional(),
    status: z.enum(bookingStatuses).optional(),
    visited: z.boolean().optional(),
    isVip: z.boolean().optional(),
    vipNotes: z.union([z.string().trim().max(500), z.null()]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type BookingMutation = z.infer<typeof bookingMutationSchema>;

export interface BookingDocument {
  bookingNumber: number;
  bookingCode: string;
  visitorId: string | null;
  visitorName: string;
  visitorNameLowercase: string;
  phone: string;
  phoneNormalized: string;
  email: string | null;
  emailLowercase: string | null;
  adults: number;
  children: number;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  visited: boolean;
  source: BookingSource;
  confirmationSent: boolean;
  reminderSent: boolean;
  reminderSentAt: Timestamp | null;
  reminderClaimedAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string | null;
  updatedBy: string | null;
  cancelledAt: Timestamp | null;
  cancelledBy: string | null;
  legacyId?: string;
  isVip?: boolean;
  vipNotes?: string | null;
  schemaVersion: typeof BOOKING_SCHEMA_VERSION;
}

export interface BookingDayDocument {
  confirmedGuests: number;
  updatedAt: Timestamp;
}

export interface PublicBookingResult {
  id: string;
  bookingNumber: number;
  bookingCode: string;
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  numberOfGuests: number;
  status: BookingStatus;
}

export interface AdminBooking extends PublicBookingResult {
  visitorId: string | null;
  phone: string;
  email: string | null;
  visited: boolean;
  source: BookingSource;
  confirmationSent: boolean;
  reminderSent: boolean;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  isVip?: boolean;
  vipNotes?: string | null;
}
