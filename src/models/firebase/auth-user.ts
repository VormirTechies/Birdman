import { z } from 'zod';

export const createFirebaseUserSchema = z.object({
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  isAdmin: z.boolean(),
}).strict();

export type CreateFirebaseUserInput = z.infer<typeof createFirebaseUserSchema>;
