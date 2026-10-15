// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase/admin', () => ({ FIREBASE_STORAGE_BUCKET: 'test-bucket', adminStorage: {} }));
import { processGalleryImage, MAX_GALLERY_FILE_SIZE } from './gallery-storage';

describe('gallery processing after Sharp security upgrade', () => {
  it.each(['jpeg', 'png', 'webp'] as const)('converts %s to bounded WebP display and thumbnail', async format => {
    const input = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#2e7d32' } })[format]().toBuffer();
    const result = await processGalleryImage(input, `image/${format}`);
    const display = await sharp(result.display).metadata();
    const thumbnail = await sharp(result.thumbnail).metadata();
    expect(display.format).toBe('webp');
    expect([result.width, result.height]).toEqual([1920, 960]);
    expect([thumbnail.width, thumbnail.height]).toEqual([480, 240]);
    expect(result.aspect).toBe('landscape');
    expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('corrects orientation, strips metadata and avoids upscaling', async () => {
    const input = await sharp({ create: { width: 80, height: 40, channels: 3, background: 'green' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await processGalleryImage(input, 'image/jpeg');
    expect([result.width, result.height]).toEqual([40, 80]);
    expect((await sharp(result.display).metadata()).exif).toBeUndefined();
    expect((await sharp(result.thumbnail).metadata()).width).toBe(40);
  });
  it('rejects oversized, malformed and GIF inputs', async () => {
    await expect(processGalleryImage(Buffer.alloc(MAX_GALLERY_FILE_SIZE + 1))).rejects.toThrow('5 MB');
    await expect(processGalleryImage(Buffer.from('invalid image'), 'image/jpeg')).rejects.toThrow('decoded safely');
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'green' } }).gif().toBuffer();
    await expect(processGalleryImage(gif)).rejects.toThrow('Only valid');
  });
});
