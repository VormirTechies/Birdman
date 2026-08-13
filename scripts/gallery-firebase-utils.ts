import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';

export const PROJECT_ID = 'birdman-7e745';
export const BUCKET = `${PROJECT_ID}.firebasestorage.app`;

export function initializeGalleryScript(target: 'emulator' | 'production') {
  if (target === 'emulator') {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:7003';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST =
      process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:7004';
    process.env.STORAGE_EMULATOR_HOST =
      process.env.STORAGE_EMULATOR_HOST || `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`;
    process.env.GCLOUD_PROJECT = PROJECT_ID;
  } else if (
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST
  ) {
    throw new Error('Production mode refuses to run while emulator hosts are configured');
  }

  const existing = getApps().find((app) => app.name === 'gallery-script');
  const credential = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? cert({
        projectId: PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    : applicationDefault();
  const app = existing ?? initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET, credential }, 'gallery-script');
  const db = target === 'production' ? getFirestore(app, 'birdman-db') : getFirestore(app);
  return { app, db, bucket: getStorage(app).bucket(BUCKET) };
}

export async function optimizeGalleryImage(input: Buffer) {
  const source = sharp(input, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
    throw new Error('Unsupported image format');
  }
  const display = await source.clone().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumbnail = await source.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  const ratio = display.info.width / display.info.height;
  return {
    display: display.data,
    thumbnail,
    width: display.info.width,
    height: display.info.height,
    aspect: ratio > 1.1 ? 'landscape' : ratio < 0.91 ? 'portrait' : 'square',
    checksumSha256: createHash('sha256').update(input).digest('hex'),
  } as const;
}

export async function uploadGalleryRecord(options: {
  db: ReturnType<typeof getFirestore>;
  bucket: ReturnType<ReturnType<typeof getStorage>['bucket']>;
  input: Buffer;
  title: string;
  caption: string | null;
  categories?: string[];
  order?: number;
  uploadedAt?: Date;
  legacyId?: string;
  dryRun?: boolean;
}) {
  const optimized = await optimizeGalleryImage(options.input);
  const duplicate = await options.db.collection('gallery').where('checksumSha256', '==', optimized.checksumSha256).limit(1).get();
  if (!duplicate.empty) return { status: 'skipped', id: duplicate.docs[0].id } as const;
  if (options.legacyId) {
    const legacyDuplicate = await options.db.collection('gallery').where('legacyId', '==', options.legacyId).limit(1).get();
    if (!legacyDuplicate.empty) return { status: 'skipped', id: legacyDuplicate.docs[0].id } as const;
  }
  if (options.dryRun) return { status: 'planned', id: options.legacyId || 'generated' } as const;

  const reference = options.db.collection('gallery').doc();
  const storagePath = `gallery/public/${reference.id}/image.webp`;
  const thumbnailStoragePath = `gallery/public/${reference.id}/thumbnail.webp`;
  const metadata = { contentType: 'image/webp', cacheControl: 'public,max-age=31536000,immutable' };
  await options.bucket.file(storagePath).save(optimized.display, { resumable: false, metadata });
  try {
    await options.bucket.file(thumbnailStoragePath).save(optimized.thumbnail, { resumable: false, metadata });
    const now = Timestamp.now();
    await reference.create({
      altText: options.title,
      caption: options.caption,
      storagePath,
      thumbnailStoragePath,
      width: optimized.width,
      height: optimized.height,
      aspect: optimized.aspect,
      categories: options.categories ?? [],
      order: options.order ?? 0,
      mimeType: 'image/webp',
      sizeBytes: optimized.display.byteLength,
      thumbnailSizeBytes: optimized.thumbnail.byteLength,
      checksumSha256: optimized.checksumSha256,
      uploadedAt: options.uploadedAt ? Timestamp.fromDate(options.uploadedAt) : now,
      updatedAt: now,
      uploadedBy: 'migration-script',
      ...(options.legacyId ? { legacyId: options.legacyId } : {}),
    });
  } catch (error) {
    await Promise.all([
      options.bucket.file(storagePath).delete({ ignoreNotFound: true }).catch(() => undefined),
      options.bucket.file(thumbnailStoragePath).delete({ ignoreNotFound: true }).catch(() => undefined),
    ]);
    throw error;
  }
  return { status: 'inserted', id: reference.id } as const;
}

export async function readProjectFile(projectRoot: string, relativePath: string) {
  return readFile(path.join(projectRoot, relativePath));
}
