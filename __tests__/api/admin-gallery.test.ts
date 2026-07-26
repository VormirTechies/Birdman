import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { GET, POST } from '@/app/api/admin/gallery/route';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('/api/admin/gallery', () => {
  const get = vi.fn();
  const orderBy = vi.fn(() => ({ get }));
  const set = vi.fn();
  const doc = vi.fn(() => ({ id: 'image-new', set }));
  const collection = vi.fn(() => ({ orderBy, doc }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1' } as never,
      response: null,
    });
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
  });

  it('lists Firestore gallery images newest first', async () => {
    const uploadedAt = Timestamp.fromDate(new Date('2026-07-01T10:00:00Z'));
    get.mockResolvedValue({
      docs: [
        {
          id: 'image-1',
          data: () => ({
            url: 'https://example.com/image.jpg',
            altText: 'Parakeets',
            caption: 'Evening gathering',
            uploadedAt,
          }),
        },
      ],
    });

    const response = await GET(
      new NextRequest('http://localhost/api/admin/gallery')
    );

    expect(response.status).toBe(200);
    expect(collection).toHaveBeenCalledWith('gallery_images');
    expect(orderBy).toHaveBeenCalledWith('uploadedAt', 'desc');
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: 'image-1',
        url: 'https://example.com/image.jpg',
        altText: 'Parakeets',
        caption: 'Evening gathering',
        uploadedAt: '2026-07-01T10:00:00.000Z',
      }),
    ]);
  });

  it('creates Firestore gallery metadata', async () => {
    set.mockResolvedValue(undefined);
    const response = await POST(
      new NextRequest('http://localhost/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/new.jpg',
          title: 'New image',
          description: 'Gallery description',
        }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/new.jpg',
        altText: 'New image',
        caption: 'Gallery description',
        createdBy: 'admin-1',
      })
    );
    expect(data).toEqual(
      expect.objectContaining({
        id: 'image-new',
        url: 'https://example.com/new.jpg',
        altText: 'New image',
        caption: 'Gallery description',
      })
    );
  });

  it.each(['', 'not-a-url', 'javascript:alert(1)'])(
    'rejects an invalid image URL',
    async (url) => {
      const response = await POST(
        new NextRequest('http://localhost/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
      );

      expect(response.status).toBe(400);
      expect(set).not.toHaveBeenCalled();
    }
  );

  it('returns the Firebase authorization response', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await GET(
      new NextRequest('http://localhost/api/admin/gallery')
    );

    expect(response.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });
});
