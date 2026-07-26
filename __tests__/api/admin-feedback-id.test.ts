import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PATCH, DELETE } from '@/app/api/admin/feedback/[id]/route';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('/api/admin/feedback/[id]', () => {
  const get = vi.fn();
  const update = vi.fn();
  const remove = vi.fn();
  const doc = vi.fn(() => ({ get, update, delete: remove }));
  const collection = vi.fn(() => ({ doc }));
  const context = { params: Promise.resolve({ id: 'feedback-1' }) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1' } as never,
      response: null,
    });
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
  });

  it('approves an existing Firestore feedback record', async () => {
    get.mockResolvedValue({ exists: true });
    update.mockResolvedValue(undefined);

    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/feedback/feedback-1', {
        method: 'PATCH',
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(collection).toHaveBeenCalledWith('feedback');
    expect(doc).toHaveBeenCalledWith('feedback-1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        isApproved: true,
        approvedBy: 'admin-1',
        approvedAt: expect.anything(),
      })
    );
    expect(await response.json()).toEqual({
      success: true,
      message: 'Feedback approved',
    });
  });

  it('returns 404 when approving missing feedback', async () => {
    get.mockResolvedValue({ exists: false });

    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/feedback/missing', {
        method: 'PATCH',
      }),
      context
    );

    expect(response.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it('deletes an existing Firestore feedback record', async () => {
    get.mockResolvedValue({ exists: true });
    remove.mockResolvedValue(undefined);

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/feedback/feedback-1', {
        method: 'DELETE',
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({
      success: true,
      message: 'Feedback deleted',
    });
  });

  it('returns 404 when deleting missing feedback', async () => {
    get.mockResolvedValue({ exists: false });

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/feedback/missing', {
        method: 'DELETE',
      }),
      context
    );

    expect(response.status).toBe(404);
    expect(remove).not.toHaveBeenCalled();
  });

  it.each([
    ['PATCH', PATCH],
    ['DELETE', DELETE],
  ] as const)('returns the Firebase authorization response for %s', async (method, handler) => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const response = await handler(
      new NextRequest('http://localhost/api/admin/feedback/feedback-1', {
        method,
      }),
      context
    );

    expect(response.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 500 when a Firestore update fails', async () => {
    get.mockResolvedValue({ exists: true });
    update.mockRejectedValue(new Error('Firestore unavailable'));

    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/feedback/feedback-1', {
        method: 'PATCH',
      }),
      context
    );

    expect(response.status).toBe(500);
  });
});
