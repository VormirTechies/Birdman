import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/users/route';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('GET /api/admin/users', () => {
  const request = new NextRequest('http://localhost/api/admin/users', {
    headers: { Authorization: 'Bearer firebase-token' },
  });
  const listUsers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1' } as never,
      response: null,
    });
    vi.mocked(getAdminAuth).mockReturnValue({ listUsers } as never);
  });

  it('returns Firebase Auth users using the existing Profile response shape', async () => {
    listUsers.mockResolvedValue({
      users: [
        {
          uid: 'user-1',
          email: 'admin@example.com',
          displayName: 'Admin User',
          photoURL: 'https://example.com/avatar.png',
          metadata: { creationTime: 'Mon, 01 Jun 2026 10:00:00 GMT' },
        },
        {
          uid: 'user-2',
          email: 'visitor@example.com',
          displayName: null,
          photoURL: null,
          metadata: { creationTime: 'Tue, 02 Jun 2026 10:00:00 GMT' },
        },
      ],
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(listUsers).toHaveBeenCalledWith(1000);
    expect(data).toEqual({
      users: [
        {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          avatarUrl: 'https://example.com/avatar.png',
          createdAt: 'Mon, 01 Jun 2026 10:00:00 GMT',
        },
        {
          id: 'user-2',
          email: 'visitor@example.com',
          name: 'visitor',
          avatarUrl: null,
          createdAt: 'Tue, 02 Jun 2026 10:00:00 GMT',
        },
      ],
      total: 2,
    });
  });

  it('returns the Firebase authorization response without listing users', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it('returns 500 when Firebase Auth cannot list users', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    listUsers.mockRejectedValue(new Error('Firebase unavailable'));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch users' });
    consoleError.mockRestore();
  });
});
