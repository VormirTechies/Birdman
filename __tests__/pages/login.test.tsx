import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLoginPage from '@/app/admin/login/page';

const replace = vi.fn();
const refresh = vi.fn();
const signIn = vi.fn();
const sendReset = vi.fn();
const firebaseSignOut = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock('@/firebase', () => ({ auth: {}, firebaseConfigError: null }));
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => signIn(...args),
  sendPasswordResetEmail: (...args: unknown[]) => sendReset(...args),
  signOut: (...args: unknown[]) => firebaseSignOut(...args),
}));
vi.mock('@/app/admin/_components/Carousel', () => ({ default: () => <div data-testid="carousel" /> }));

describe('Firebase admin login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    signIn.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue('id-token') } });
    sendReset.mockResolvedValue(undefined);
  });

  it('authorizes the Firebase user with the server before redirecting', async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    await user.type(screen.getByLabelText('Email Address'), 'ADMIN@EXAMPLE.COM ');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith({}, 'admin@example.com', 'Secret123'));
    expect(fetch).toHaveBeenCalledWith('/api/admin/session', expect.objectContaining({
      headers: { Authorization: 'Bearer id-token' },
    }));
    expect(replace).toHaveBeenCalledWith('/admin');
  });

  it('signs out a valid Firebase user without an admin role', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 403 } as Response);
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Log In' }));
    await waitFor(() => expect(firebaseSignOut).toHaveBeenCalled());
    expect(screen.getByRole('alert')).toHaveTextContent("You don't have permission");
    expect(replace).not.toHaveBeenCalledWith('/admin');
  });

  it('distinguishes a blocked Firebase request from invalid credentials', async () => {
    signIn.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    await user.type(screen.getByLabelText('Email Address'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to reach Firebase Authentication'
    );
  });

  it('uses Firebase reset email and always shows a generic recovery result', async () => {
    sendReset.mockRejectedValueOnce(new Error('user not found'));
    const user = userEvent.setup();
    render(<AdminLoginPage />);
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await screen.findByRole('heading', { name: 'Forgot Password' });
    await user.type(document.querySelector('#forgot-email') as HTMLInputElement, 'missing@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(/If an account exists/)).toBeInTheDocument();
  });
});
