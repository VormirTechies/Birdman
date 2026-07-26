import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { GET } from '@/app/api/admin/feedback/route';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('/api/admin/feedback', () => {
  const get = vi.fn();
  const where = vi.fn(() => ({ get }));
  const collection = vi.fn(() => ({ where }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1' } as never,
      response: null,
    });
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
  });

  it('returns pending Firestore feedback newest first', async () => {
    get.mockResolvedValue({
      docs: [
        {
          id: 'older',
          data: () => ({
            visitorName: 'First visitor',
            message: 'Older feedback',
            rating: 4,
            isApproved: false,
            createdAt: Timestamp.fromDate(new Date('2026-07-01T10:00:00Z')),
          }),
        },
        {
          id: 'newer',
          data: () => ({
            visitorName: 'Second visitor',
            message: 'Newer feedback',
            rating: 5,
            isApproved: false,
            createdAt: Timestamp.fromDate(new Date('2026-07-02T10:00:00Z')),
          }),
        },
      ],
    });

    const response = await GET(
      new NextRequest('http://localhost/api/admin/feedback')
    );

    expect(response.status).toBe(200);
    expect(collection).toHaveBeenCalledWith('feedback');
    expect(where).toHaveBeenCalledWith('isApproved', '==', false);
    expect(await response.json()).toEqual([
      {
        id: 'newer',
        visitorName: 'Second visitor',
        message: 'Newer feedback',
        rating: 5,
        isApproved: false,
        createdAt: '2026-07-02T10:00:00.000Z',
      },
      {
        id: 'older',
        visitorName: 'First visitor',
        message: 'Older feedback',
        rating: 4,
        isApproved: false,
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    ]);
  });

  it('returns the Firebase authorization response without reading Firestore', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await GET(
      new NextRequest('http://localhost/api/admin/feedback')
    );

    expect(response.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 500 when Firestore fails', async () => {
    get.mockRejectedValue(new Error('Firestore unavailable'));

    const response = await GET(
      new NextRequest('http://localhost/api/admin/feedback')
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});
