import type { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const galleryAspectSchema = z.enum(['square', 'landscape', 'portrait']);

export const galleryMetadataSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(160),
    description: z.string().trim().max(500).nullable().optional(),
    categories: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
    order: z.number().int().min(0).max(100000).default(0),
  })
  .strict()
  .transform((value) => ({
    ...value,
    description: value.description || null,
    categories: [...new Set(value.categories.map((category) => category.toLowerCase()))],
  }));

export const galleryListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(15),
    cursor: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type GalleryAspect = z.infer<typeof galleryAspectSchema>;
export type GalleryMetadata = z.infer<typeof galleryMetadataSchema>;

export interface GalleryDocument {
  altText: string;
  caption: string | null;
  storagePath: string;
  thumbnailStoragePath: string;
  width: number;
  height: number;
  aspect: GalleryAspect;
  categories: string[];
  order: number;
  mimeType: 'image/webp';
  sizeBytes: number;
  thumbnailSizeBytes: number;
  checksumSha256: string;
  uploadedAt: Timestamp;
  updatedAt: Timestamp;
  uploadedBy: string;
  legacyId?: string;
}

export interface PublicGalleryImage {
  id: string;
  src: string;
  thumbnailSrc: string;
  title: string;
  description?: string;
  aspect: GalleryAspect;
  width: number;
  height: number;
  uploadedAt: string;
}

export interface AdminGalleryImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string;
  caption: string | null;
  aspect: GalleryAspect;
  width: number;
  height: number;
  categories: string[];
  order: number;
  uploadedAt: string;
}

export interface GalleryPage<T> {
  images: T[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}
