import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/profile/update-request/route';
import { sendAdminVerificationCode } from '@/lib/email';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

vi.mock('@/lib/email', () => ({
  sendAdminVerificationCode: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

describe('POST /api/admin/profile/update-request', () => {
  const getUserByEmail = vi.fn();
  const set = vi.fn();
  const remove = vi.fn();
  const doc = vi.fn(() => ({ set, delete: remove }));
  const collection = vi.fn(() => ({ doc }));

  function request(newEmail: unknown) {
    return new NextRequest('http://localhost/api/admin/profile/update-request', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer firebase-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newEmail }),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1', email: 'current@example.com' } as never,
      response: null,
    });
    vi.mocked(getAdminAuth).mockReturnValue({ getUserByEmail } as never);
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
    getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
    set.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
    vi.mocked(sendAdminVerificationCode).mockResolvedValue({ success: true });
  });

  it('stores a hashed Firebase verification request and emails a six-digit code', async () => {
    const response = await POST(request(' New.Email@example.com '));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(collection).toHaveBeenCalledWith('admin_email_verifications');
    expect(doc).toHaveBeenCalledWith('admin-1');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        newEmail: 'new.email@example.com',
        codeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        attempts: 0,
      })
    );
    expect(sendAdminVerificationCode).toHaveBeenCalledWith(
      'new.email@example.com',
      expect.stringMatching(/^\d{6}$/)
    );
    const emailedCode = vi.mocked(sendAdminVerificationCode).mock.calls[0][1];
    expect(JSON.stringify(set.mock.calls[0][0])).not.toContain(emailedCode);
    expect(data).toEqual({
      success: true,
      message: 'Verification code sent to your new email',
    });
  });

  it.each([undefined, '', 'invalid', 'name@domain'])(
    'rejects an invalid email address',
    async (newEmail) => {
      const response = await POST(request(newEmail));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid email address' });
      expect(set).not.toHaveBeenCalled();
    }
  );

  it('rejects the current Firebase email address', async () => {
    const response = await POST(request('CURRENT@example.com'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'New email must be different from the current email',
    });
  });

  it('rejects an email owned by another Firebase user', async () => {
    getUserByEmail.mockResolvedValue({ uid: 'another-user' });

    const response = await POST(request('existing@example.com'));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Email address is already in use',
    });
    expect(set).not.toHaveBeenCalled();
  });

  it('deletes the Firestore request when email delivery fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(sendAdminVerificationCode).mockResolvedValue({
      success: false,
      error: 'SMTP unavailable',
    });

    const response = await POST(request('new@example.com'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Failed to send verification email',
    });
    expect(remove).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('returns the Firebase authorization response before processing the email', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await POST(request('new@example.com'));

    expect(response.status).toBe(401);
    expect(getUserByEmail).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
