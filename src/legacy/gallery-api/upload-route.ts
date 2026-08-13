// Legacy POST /api/admin/gallery/upload uploaded the original file to the
// public Supabase `gallery` bucket and stored its URL in Postgres.
export const legacyGalleryUploadApi = { storage: 'Supabase gallery bucket' } as const;
