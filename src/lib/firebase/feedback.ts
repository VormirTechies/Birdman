import 'server-only';

import { FieldPath, Timestamp, type Query } from 'firebase-admin/firestore';
import firebaseAdminApp, { getAdminDb } from '@/lib/firebase/admin';
import type {
  AdminFeedback,
  FeedbackDocument,
  FeedbackSubmission,
  PublicFeedback,
} from '@/models/firestore/feedback';

const COLLECTION = 'feedback';

export class FeedbackNotFoundError extends Error {
  constructor() {
    super('Feedback not found');
    this.name = 'FeedbackNotFoundError';
  }
}

export class InvalidFeedbackCursorError extends Error {
  constructor() {
    super('Invalid feedback cursor');
    this.name = 'InvalidFeedbackCursorError';
  }
}

export interface ApprovedFeedbackPage {
  feedback: PublicFeedback[];
  nextCursor: string | null;
  hasMore: boolean;
}

function encodeCursor(createdAt: Timestamp, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toMillis(), id })).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Timestamp; id: string } {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      createdAt?: unknown;
      id?: unknown;
    };
    if (!Number.isFinite(value.createdAt) || typeof value.id !== 'string' || !value.id) {
      throw new Error('Malformed cursor');
    }
    return { createdAt: Timestamp.fromMillis(value.createdAt as number), id: value.id };
  } catch {
    throw new InvalidFeedbackCursorError();
  }
}

function toPublicFeedback(id: string, data: FeedbackDocument): PublicFeedback {
  const createdAt = data.createdAt?.toDate?.() ?? new Date(0);
  return {
    id,
    name: data.name,
    message: data.message,
    createdAt: createdAt.toISOString(),
  };
}

function toAdminFeedback(id: string, data: FeedbackDocument): AdminFeedback {
  return {
    ...toPublicFeedback(id, data),
    email: data.email,
    status: data.status,
    approvedAt: data.approvedAt?.toDate().toISOString() ?? null,
    approvedBy: data.approvedBy,
  };
}

export async function createFirestoreFeedback(input: FeedbackSubmission) {
  const now = Timestamp.now();
  const document: FeedbackDocument = {
    name: input.name,
    email: input.email,
    message: input.feedback,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
    approvedBy: null,
  };
  const reference = await getAdminDb().collection(COLLECTION).add(document);
  console.info('[feedback] Firestore document created', {
    id: reference.id,
    project: firebaseAdminApp.options.projectId ?? null,
    database: 'birdman-db',
    target: process.env.FIRESTORE_EMULATOR_HOST ? 'emulator' : 'production',
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST ?? null,
  });
  return { id: reference.id, status: document.status } as const;
}

export async function listApprovedFirestoreFeedbackPage(
  pageSize = 12,
  cursor?: string
): Promise<ApprovedFeedbackPage> {
  let query: Query = getAdminDb()
    .collection(COLLECTION)
    .where('status', '==', 'approved')
    .orderBy('createdAt', 'desc')
    .orderBy(FieldPath.documentId(), 'desc');

  if (cursor) {
    const decoded = decodeCursor(cursor);
    query = query.startAfter(decoded.createdAt, decoded.id);
  }

  const snapshot = await query.limit(pageSize + 1).get();
  const pageDocs = snapshot.docs.slice(0, pageSize);
  const lastDocument = pageDocs.at(-1);
  const hasMore = snapshot.docs.length > pageSize;

  return {
    feedback: pageDocs.map((doc) =>
      toPublicFeedback(doc.id, doc.data() as FeedbackDocument)
    ),
    hasMore,
    nextCursor: hasMore && lastDocument
      ? encodeCursor((lastDocument.data() as FeedbackDocument).createdAt, lastDocument.id)
      : null,
  };
}

export async function listPendingFirestoreFeedback(limit = 100): Promise<AdminFeedback[]> {
  const snapshot = await getAdminDb()
    .collection(COLLECTION)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) =>
    toAdminFeedback(doc.id, doc.data() as FeedbackDocument)
  );
}

export async function approveFirestoreFeedback(id: string, adminUid: string) {
  const reference = getAdminDb().collection(COLLECTION).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new FeedbackNotFoundError();
  const now = Timestamp.now();
  await reference.update({
    status: 'approved',
    approvedAt: now,
    approvedBy: adminUid,
    updatedAt: now,
  });
}

export async function deleteFirestoreFeedback(id: string) {
  const reference = getAdminDb().collection(COLLECTION).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new FeedbackNotFoundError();
  await reference.delete();
}
