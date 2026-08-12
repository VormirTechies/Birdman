import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAdmin, createFirebaseUser, listFirebaseUsers } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createFirebaseUser: vi.fn(),
  listFirebaseUsers: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/require-admin', () => ({ requireAdmin }));
vi.mock('@/lib/firebase/admin-users', () => ({ createFirebaseUser, listFirebaseUsers }));

import { GET, POST } from '@/app/api/admin/users/route';

const adminResult = {
  user: { uid: 'admin-uid' },
  admin: { uid: 'admin-uid', email: 'admin@example.com', displayName: 'Admin', role: 'admin' },
  response: null,
};

describe('/api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue(adminResult);
  });

  it('keeps both listing and creation protected', async () => {
    const forbidden = new Response('{}', { status: 403 });
    requireAdmin.mockResolvedValue({ user: null, response: forbidden });
    expect((await GET(new Request('http://localhost/api/admin/users'))).status).toBe(403);
    expect((await POST(new Request('http://localhost/api/admin/users', { method: 'POST' }))).status).toBe(403);
  });

  it('rejects invalid fields and unknown payload properties', async () => {
    const response = await POST(new Request('http://localhost/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'A', email: 'bad', password: 'short', isAdmin: true, role: 'admin' }),
    }));
    expect(response.status).toBe(400);
    expect(createFirebaseUser).not.toHaveBeenCalled();
  });

  it('normalizes input and creates an administrator', async () => {
    const created = { id: 'new-uid', email: 'new@example.com', name: 'New User', role: 'admin' };
    createFirebaseUser.mockResolvedValue(created);
    const response = await POST(new Request('http://localhost/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        displayName: '  New User  ',
        email: ' NEW@EXAMPLE.COM ',
        password: 'Secure123',
        isAdmin: true,
      }),
    }));
    expect(response.status).toBe(201);
    expect(createFirebaseUser).toHaveBeenCalledWith({
      displayName: 'New User',
      email: 'new@example.com',
      password: 'Secure123',
      isAdmin: true,
    });
    expect(await response.json()).toEqual({ success: true, user: created });
  });

  it('returns a conflict for an existing Firebase email', async () => {
    createFirebaseUser.mockRejectedValue(Object.assign(new Error('exists'), { code: 'auth/email-already-exists' }));
    const response = await POST(new Request('http://localhost/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'New User', email: 'new@example.com', password: 'Secure123', isAdmin: false }),
    }));
    expect(response.status).toBe(409);
  });
});
