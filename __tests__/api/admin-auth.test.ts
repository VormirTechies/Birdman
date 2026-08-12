import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyIdToken, authorizeAdminToken } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  authorizeAdminToken: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: () => ({ verifyIdToken }),
}));
vi.mock('@/lib/firebase/admin-users', () => ({ authorizeAdminToken }));

import { requireAdmin } from '@/lib/require-admin';
import { GET as getSession } from '@/app/api/admin/session/route';

const request = (token?: string) => new Request('http://localhost/api/admin/session', {
  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});

describe('Firebase administrator authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for missing and invalid bearer tokens', async () => {
    const missing = await requireAdmin(request());
    expect(missing.response?.status).toBe(401);

    verifyIdToken.mockRejectedValueOnce(new Error('expired'));
    const invalid = await requireAdmin(request('expired-token'));
    expect(invalid.response?.status).toBe(401);
  });

  it('returns 403 when the authenticated user lacks an admin role document', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'ordinary-user', email: 'user@example.com' });
    authorizeAdminToken.mockResolvedValueOnce(null);
    const result = await requireAdmin(request('valid-token'));
    expect(result.response?.status).toBe(403);
  });

  it('returns only the safe administrator session fields', async () => {
    const decoded = { uid: 'admin-uid', email: 'admin@example.com' };
    const session = { ...decoded, displayName: 'Admin', role: 'admin' };
    verifyIdToken.mockResolvedValueOnce(decoded);
    authorizeAdminToken.mockResolvedValueOnce(session);
    const response = await getSession(request('valid-token'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, user: session });
  });
});
