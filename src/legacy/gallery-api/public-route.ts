// Legacy GET /api/gallery used Drizzle offset pagination against galleryImages.
export const legacyPublicGalleryApi = {
  storage: 'Postgres gallery_images',
  pagination: 'offset/limit',
  order: 'uploaded_at DESC',
} as const;
