// Legacy GET/POST /api/admin/gallery used Postgres metadata helpers.
export const legacyAdminGalleryApi = {
  metadata: 'Postgres gallery_images',
  authorization: 'requireAdmin',
} as const;
