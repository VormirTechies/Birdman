import { describe, expect, it } from 'vitest';
import { galleryListQuerySchema, galleryMetadataSchema } from './gallery';

describe('gallery schemas', () => {
  it('normalizes valid metadata', () => {
    expect(galleryMetadataSchema.parse({
      title: '  Parakeet arrival  ',
      description: '  Rooftop gathering  ',
      categories: [' Birds ', 'birds'],
      order: 2,
    })).toEqual({
      title: 'Parakeet arrival',
      description: 'Rooftop gathering',
      categories: ['birds'],
      order: 2,
    });
  });

  it('rejects unknown metadata and invalid boundaries', () => {
    expect(() => galleryMetadataSchema.parse({ title: 'x', extra: true })).toThrow();
    expect(() => galleryMetadataSchema.parse({ title: 'x'.repeat(161) })).toThrow();
    expect(() => galleryMetadataSchema.parse({ title: 'Valid title', description: 'x'.repeat(501) })).toThrow();
  });

  it('enforces cursor page limits', () => {
    expect(galleryListQuerySchema.parse({}).limit).toBe(15);
    expect(galleryListQuerySchema.parse({ limit: '50' }).limit).toBe(50);
    expect(() => galleryListQuerySchema.parse({ limit: '51' })).toThrow();
  });
});
