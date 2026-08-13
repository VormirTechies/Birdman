import 'server-only';

import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { FIREBASE_STORAGE_BUCKET, adminStorage } from '@/lib/firebase/admin';
import type { GalleryAspect } from '@/models/firestore/gallery';

const DISPLAY_MAX_EDGE = 1920;
const THUMBNAIL_MAX_EDGE = 480;
const MAX_INPUT_PIXELS = 40_000_000;
export const MAX_GALLERY_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_GALLERY_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface ProcessedGalleryImage {
  display: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
  aspect: GalleryAspect;
  checksumSha256: string;
}

export class InvalidGalleryImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGalleryImageError';
  }
}

function computeAspect(width: number, height: number): GalleryAspect {
  if (width > height * 1.1) return 'landscape';
  if (height > width * 1.1) return 'portrait';
  return 'square';
}

export async function processGalleryImage(
  input: Buffer,
  declaredMimeType?: string
): Promise<ProcessedGalleryImage> {
  if (input.byteLength === 0) throw new InvalidGalleryImageError('Image is empty');
  if (input.byteLength > MAX_GALLERY_FILE_SIZE) {
    throw new InvalidGalleryImageError('Image must be 5 MB or smaller');
  }
  if (
    declaredMimeType &&
    !ALLOWED_GALLERY_MIME_TYPES.includes(
      declaredMimeType as (typeof ALLOWED_GALLERY_MIME_TYPES)[number]
    )
  ) {
    throw new InvalidGalleryImageError('Only JPG, PNG, or WebP images are allowed');
  }

  try {
    const source = sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS }).rotate();
    const metadata = await source.metadata();
    if (!metadata.width || !metadata.height || !['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
      throw new InvalidGalleryImageError('Only valid JPG, PNG, or WebP images are allowed');
    }

    const displayResult = await source
      .clone()
      .resize({ width: DISPLAY_MAX_EDGE, height: DISPLAY_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const thumbnailResult = await source
      .clone()
      .resize({ width: THUMBNAIL_MAX_EDGE, height: THUMBNAIL_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer({ resolveWithObject: true });

    return {
      display: displayResult.data,
      thumbnail: thumbnailResult.data,
      width: displayResult.info.width,
      height: displayResult.info.height,
      aspect: computeAspect(displayResult.info.width, displayResult.info.height),
      checksumSha256: createHash('sha256').update(input).digest('hex'),
    };
  } catch (error) {
    if (error instanceof InvalidGalleryImageError) throw error;
    throw new InvalidGalleryImageError('The image could not be decoded safely');
  }
}

export function galleryStoragePaths(documentId: string) {
  return {
    storagePath: `gallery/public/${documentId}/image.webp`,
    thumbnailStoragePath: `gallery/public/${documentId}/thumbnail.webp`,
  };
}

export function getGalleryPublicUrl(storagePath: string): string {
  const encodedPath = encodeURIComponent(storagePath);
  const emulatorHost = (
    process.env.STORAGE_EMULATOR_HOST ||
    (process.env.FIREBASE_STORAGE_EMULATOR_HOST
      ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
      : '')
  ).replace(/^https?:\/\//, '');
  if (emulatorHost) {
    return `http://${emulatorHost}/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
}

export async function uploadGalleryMedia(
  paths: ReturnType<typeof galleryStoragePaths>,
  image: ProcessedGalleryImage
) {
  const bucket = adminStorage.bucket(FIREBASE_STORAGE_BUCKET);
  const metadata = {
    contentType: 'image/webp',
    cacheControl: 'public,max-age=31536000,immutable',
  };

  await bucket.file(paths.storagePath).save(image.display, { resumable: false, metadata });
  try {
    await bucket.file(paths.thumbnailStoragePath).save(image.thumbnail, { resumable: false, metadata });
  } catch (error) {
    await bucket.file(paths.storagePath).delete({ ignoreNotFound: true }).catch(() => undefined);
    throw error;
  }
}

export async function deleteGalleryMedia(storagePath: string, thumbnailStoragePath: string) {
  const bucket = adminStorage.bucket(FIREBASE_STORAGE_BUCKET);
  await Promise.all([
    bucket.file(storagePath).delete({ ignoreNotFound: true }),
    bucket.file(thumbnailStoragePath).delete({ ignoreNotFound: true }),
  ]);
}
