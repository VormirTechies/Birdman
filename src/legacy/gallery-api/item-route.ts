// Legacy PUT/DELETE /api/admin/gallery/[id] updated Postgres and inferred a
// Supabase object path from a client-supplied public URL during deletion.
export const legacyGalleryItemApi = { storage: 'Supabase gallery bucket' } as const;
