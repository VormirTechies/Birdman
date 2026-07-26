import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/change-password/route';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('POST /api/admin/change-password', () => {
  const updateUser = vi.fn();

  function request(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/admin/change-password', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer firebase-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'firebase-web-key';
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1', email: 'admin@example.com' } as never,
      response: null,
    });
    vi.mocked(getAdminAuth).mockReturnValue({ updateUser } as never);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn(),
    });
  });

  it('verifies the current password and updates the Firebase Auth user', async () => {
    updateUser.mockResolvedValue({});

    const response = await POST(
      request({ currentPassword: 'Current123', newPassword: 'NewPassword456' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('accounts:signInWithPassword?key=firebase-web-key'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Current123',
          returnSecureToken: false,
        }),
      })
    );
    expect(updateUser).toHaveBeenCalledWith('admin-1', {
      password: 'NewPassword456',
    });
    expect(data).toEqual({
      success: true,
      message: 'Password updated successfully',
    });
  });

  it('returns 400 when the current Firebase password is incorrect', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: { message: 'INVALID_LOGIN_CREDENTIALS' },
      }),
    });

    const response = await POST(
      request({ currentPassword: 'Wrong123', newPassword: 'NewPassword456' })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Current password is incorrect' });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it.each([
    [{ currentPassword: '', newPassword: 'NewPassword456' }, 'currentPassword and newPassword are required'],
    [{ currentPassword: 'Current123', newPassword: 'short' }, 'Password must be at least 8 characters long'],
    [{ currentPassword: 'Current123', newPassword: 'lowercase123' }, 'Password must contain at least one uppercase letter'],
    [{ currentPassword: 'Current123', newPassword: 'NoNumbersHere' }, 'Password must contain at least one number'],
  ])('validates password input', async (body, message) => {
    const response = await POST(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: message });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('returns the Firebase authorization response before reading the password', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await POST(
      request({ currentPassword: 'Current123', newPassword: 'NewPassword456' })
    );

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('returns 500 when Firebase cannot update the password', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    updateUser.mockRejectedValue(new Error('Firebase unavailable'));

    const response = await POST(
      request({ currentPassword: 'Current123', newPassword: 'NewPassword456' })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Failed to update password. Please try again.',
    });
    consoleError.mockRestore();
  });
});
