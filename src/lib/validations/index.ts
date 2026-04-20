import { z } from 'zod';

// ─── Booking Validation ──────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  visitorName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email address').or(z.literal('')),
  category: z.enum(['individual', 'school', 'organisation']).default('individual'),
  organisationName: z.string().optional(),
  numberOfGuests: z
    .number()
    .int('Number of guests must be an integer')
    .min(1, 'At least 1 guest required'),
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate > today;
    }, 'Booking date must be in the future')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return bookingDate <= thirtyDaysFromNow;
    }, 'Bookings can only be made up to 30 days in advance'),
  bookingTime: z
    .string()
    .min(4, 'Time must be provided'),
}).superRefine((data, ctx) => {
  if (data.category === 'individual' && data.numberOfGuests > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum 10 guests for individual bookings',
      path: ['numberOfGuests'],
    });
  }
  if (data.category !== 'individual' && (!data.organisationName || data.organisationName.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Organisation name is required for this booking type',
      path: ['organisationName'],
    });
  }
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ─── Update Booking Validation ───────────────────────────────────────────────

export const updateBookingSchema = z.object({
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate > today;
    }, 'Booking date must be in the future')
    .optional(),
  bookingTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
    .optional(),
}).refine((data) => data.bookingDate || data.bookingTime, {
  message: 'At least one field (bookingDate or bookingTime) must be provided',
});

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// ─── Feedback Validation ─────────────────────────────────────────────────────

export const createFeedbackSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

// ─── Session Validation ──────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  date: z.date(),
  type: z.enum(['morning', 'evening']),
  capacity: z.number().int().min(1).max(100).default(20),
  isAvailable: z.boolean().default(true),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ─── Admin Login Validation ──────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
