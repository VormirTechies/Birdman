import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { DELETE, PUT } from '@/app/api/admin/gallery/[id]/route';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('/api/admin/gallery/[id]', () => {
  const get = vi.fn();
  const update = vi.fn();
  const remove = vi.fn();
  const doc = vi.fn(() => ({ get, update, delete: remove }));
  const collection = vi.fn(() => ({ doc }));
  const context = { params: Promise.resolve({ id: 'image-1' }) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1' } as never,
      response: null,
    });
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
  });

  it('updates gallery metadata in Firestore', async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({
        url: 'https://example.com/image.jpg',
        altText: 'Old title',
        caption: null,
        uploadedAt: Timestamp.fromDate(new Date('2026-07-01T10:00:00Z')),
      }),
    });
    update.mockResolvedValue(undefined);

    const response = await PUT(
      new NextRequest('http://localhost/api/admin/gallery/image-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated title',
          description: 'Updated description',
        }),
      }),
      context
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(collection).toHaveBeenCalledWith('gallery_images');
    expect(doc).toHaveBeenCalledWith('image-1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        altText: 'Updated title',
        caption: 'Updated description',
        updatedBy: 'admin-1',
      })
    );
    expect(data.image).toEqual(
      expect.objectContaining({
        id: 'image-1',
        url: 'https://example.com/image.jpg',
        altText: 'Updated title',
        caption: 'Updated description',
      })
    );
  });

  it('rejects an empty title', async () => {
    const response = await PUT(
      new NextRequest('http://localhost/api/admin/gallery/image-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '   ' }),
      }),
      context
    );

    expect(response.status).toBe(400);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a missing image', async () => {
    get.mockResolvedValue({ exists: false });

    const response = await PUT(
      new NextRequest('http://localhost/api/admin/gallery/image-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Title' }),
      }),
      context
    );

    expect(response.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it('deletes an existing Firestore gallery record', async () => {
    get.mockResolvedValue({ exists: true });
    remove.mockResolvedValue(undefined);

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/gallery/image-1', {
        method: 'DELETE',
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({
      success: true,
      message: 'Gallery image removed',
    });
  });

  it('returns 404 when deleting a missing image', async () => {
    get.mockResolvedValue({ exists: false });

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/gallery/image-1', {
        method: 'DELETE',
      }),
      context
    );

    expect(response.status).toBe(404);
    expect(remove).not.toHaveBeenCalled();
  });

  it('returns the Firebase authorization response', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/gallery/image-1', {
        method: 'DELETE',
      }),
      context
    );

    expect(response.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });
});
