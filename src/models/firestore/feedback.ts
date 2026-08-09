import type { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const feedbackSubmissionSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    feedback: z
      .string()
      .trim()
      .min(20, 'Feedback must be at least 20 characters')
      .max(500, 'Feedback must be 500 characters or fewer'),
    website: z.string().max(200).optional().default(''),
  })
  .strict();

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;
export type FeedbackStatus = 'pending' | 'approved';

export interface FeedbackDocument {
  name: string;
  email: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt: Timestamp | null;
  approvedBy: string | null;
}

export interface PublicFeedback {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export interface AdminFeedback extends PublicFeedback {
  email: string;
  status: FeedbackStatus;
  approvedAt: string | null;
  approvedBy: string | null;
}
