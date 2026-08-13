import 'server-only';

import { FieldPath, Timestamp, type Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  deleteGalleryMedia,
  galleryStoragePaths,
  getGalleryPublicUrl,
  uploadGalleryMedia,
  type ProcessedGalleryImage,
} from '@/lib/firebase/gallery-storage';
import type {
  AdminGalleryImage,
  GalleryDocument,
  GalleryMetadata,
  GalleryPage,
  PublicGalleryImage,
} from '@/models/firestore/gallery';

const COLLECTION = 'gallery';

export class GalleryNotFoundError extends Error {
  constructor() {
    super('Gallery image not found');
    this.name = 'GalleryNotFoundError';
  }
}

export class InvalidGalleryCursorError extends Error {
  constructor() {
    super('Invalid gallery cursor');
    this.name = 'InvalidGalleryCursorError';
  }
}

function encodeCursor(uploadedAt: Timestamp, id: string) {
  return Buffer.from(JSON.stringify({ uploadedAt: uploadedAt.toMillis(), id })).toString('base64url');
}

function decodeCursor(cursor: string): { uploadedAt: Timestamp; id: string } {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      uploadedAt?: unknown;
      id?: unknown;
    };
    if (!Number.isFinite(value.uploadedAt) || typeof value.id !== 'string' || !value.id) {
      throw new Error('Malformed cursor');
    }
    return { uploadedAt: Timestamp.fromMillis(value.uploadedAt as number), id: value.id };
  } catch {
    throw new InvalidGalleryCursorError();
  }
}

function toPublicImage(id: string, data: GalleryDocument): PublicGalleryImage {
  return {
    id,
    src: getGalleryPublicUrl(data.storagePath),
    thumbnailSrc: getGalleryPublicUrl(data.thumbnailStoragePath),
    title: data.altText,
    description: data.caption || undefined,
    aspect: data.aspect,
    width: data.width,
    height: data.height,
    uploadedAt: data.uploadedAt.toDate().toISOString(),
  };
}

function toAdminImage(id: string, data: GalleryDocument): AdminGalleryImage {
  return {
    id,
    url: getGalleryPublicUrl(data.storagePath),
    thumbnailUrl: getGalleryPublicUrl(data.thumbnailStoragePath),
    altText: data.altText,
    caption: data.caption,
    aspect: data.aspect,
    width: data.width,
    height: data.height,
    categories: data.categories,
    order: data.order,
    uploadedAt: data.uploadedAt.toDate().toISOString(),
  };
}

async function listGalleryDocuments(pageSize: number, cursor?: string) {
  let query: Query = getAdminDb()
    .collection(COLLECTION)
    .orderBy('uploadedAt', 'desc')
    .orderBy(FieldPath.documentId(), 'desc');
  if (cursor) {
    const decoded = decodeCursor(cursor);
    query = query.startAfter(decoded.uploadedAt, decoded.id);
  }
  const snapshot = await query.limit(pageSize + 1).get();
  const pageDocs = snapshot.docs.slice(0, pageSize);
  const lastDocument = pageDocs.at(-1);
  const hasMore = snapshot.docs.length > pageSize;
  return {
    pageDocs,
    hasMore,
    nextCursor:
      hasMore && lastDocument
        ? encodeCursor((lastDocument.data() as GalleryDocument).uploadedAt, lastDocument.id)
        : null,
  };
}

export async function listPublicGalleryPage(
  pageSize = 15,
  cursor?: string
): Promise<GalleryPage<PublicGalleryImage>> {
  const page = await listGalleryDocuments(pageSize, cursor);
  return {
    images: page.pageDocs.map((doc) => toPublicImage(doc.id, doc.data() as GalleryDocument)),
    pagination: { limit: pageSize, hasMore: page.hasMore, nextCursor: page.nextCursor },
  };
}

export async function listAdminGalleryPage(
  pageSize = 15,
  cursor?: string
): Promise<GalleryPage<AdminGalleryImage>> {
  const page = await listGalleryDocuments(pageSize, cursor);
  return {
    images: page.pageDocs.map((doc) => toAdminImage(doc.id, doc.data() as GalleryDocument)),
    pagination: { limit: pageSize, hasMore: page.hasMore, nextCursor: page.nextCursor },
  };
}

export async function countGalleryImages() {
  const result = await getAdminDb().collection(COLLECTION).count().get();
  return result.data().count;
}

export interface CreateGalleryImageInput {
  metadata: GalleryMetadata;
  processed: ProcessedGalleryImage;
  uploadedBy: string;
  uploadedAt?: Date;
  legacyId?: string;
}

export async function createFirestoreGalleryImage(input: CreateGalleryImageInput) {
  const reference = getAdminDb().collection(COLLECTION).doc();
  const paths = galleryStoragePaths(reference.id);
  const now = Timestamp.now();
  const document: GalleryDocument = {
    altText: input.metadata.title,
    caption: input.metadata.description,
    ...paths,
    width: input.processed.width,
    height: input.processed.height,
    aspect: input.processed.aspect,
    categories: input.metadata.categories,
    order: input.metadata.order,
    mimeType: 'image/webp',
    sizeBytes: input.processed.display.byteLength,
    thumbnailSizeBytes: input.processed.thumbnail.byteLength,
    checksumSha256: input.processed.checksumSha256,
    uploadedAt: input.uploadedAt ? Timestamp.fromDate(input.uploadedAt) : now,
    updatedAt: now,
    uploadedBy: input.uploadedBy,
    ...(input.legacyId ? { legacyId: input.legacyId } : {}),
  };

  await uploadGalleryMedia(paths, input.processed);
  try {
    await reference.create(document);
  } catch (error) {
    await deleteGalleryMedia(paths.storagePath, paths.thumbnailStoragePath).catch(() => undefined);
    throw error;
  }
  return toAdminImage(reference.id, document);
}

export async function updateFirestoreGalleryImage(id: string, metadata: GalleryMetadata) {
  const reference = getAdminDb().collection(COLLECTION).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new GalleryNotFoundError();
  await reference.update({
    altText: metadata.title,
    caption: metadata.description,
    categories: metadata.categories,
    order: metadata.order,
    updatedAt: Timestamp.now(),
  });
  const updated = { ...(snapshot.data() as GalleryDocument), altText: metadata.title, caption: metadata.description, categories: metadata.categories, order: metadata.order };
  return toAdminImage(id, updated);
}

export async function deleteFirestoreGalleryImage(id: string) {
  const reference = getAdminDb().collection(COLLECTION).doc(id);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new GalleryNotFoundError();
  const data = snapshot.data() as GalleryDocument;
  await deleteGalleryMedia(data.storagePath, data.thumbnailStoragePath);
  await reference.delete();
}

export async function findGalleryImageByChecksum(checksumSha256: string) {
  const snapshot = await getAdminDb()
    .collection(COLLECTION)
    .where('checksumSha256', '==', checksumSha256)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0].id;
}

export async function findGalleryImageByLegacyId(legacyId: string) {
  const snapshot = await getAdminDb()
    .collection(COLLECTION)
    .where('legacyId', '==', legacyId)
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0].id;
}
