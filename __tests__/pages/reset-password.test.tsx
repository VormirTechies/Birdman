import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/admin/reset-password/page';

const replace = vi.fn();
const verifyCode = vi.fn();
const confirmReset = vi.fn();
let params: Record<string, string | null> = { mode: 'resetPassword', oobCode: 'valid-code' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (key: string) => params[key] ?? null }),
}));
vi.mock('@/firebase', () => ({ auth: {}, firebaseConfigError: null }));
vi.mock('firebase/auth', () => ({
  verifyPasswordResetCode: (...args: unknown[]) => verifyCode(...args),
  confirmPasswordReset: (...args: unknown[]) => confirmReset(...args),
}));

describe('Firebase password reset action page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = { mode: 'resetPassword', oobCode: 'valid-code' };
    verifyCode.mockResolvedValue('admin@example.com');
    confirmReset.mockResolvedValue(undefined);
  });

  it('validates the action code before showing the form', async () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText(/Checking your reset link/)).toBeInTheDocument();
    expect(await screen.findByLabelText('New password')).toBeInTheDocument();
    expect(verifyCode).toHaveBeenCalledWith({}, 'valid-code');
  });

  it('shows an invalid state for missing or expired links', async () => {
    verifyCode.mockRejectedValueOnce(new Error('expired'));
    render(<ResetPasswordPage />);
    expect(await screen.findByText('Link expired or invalid')).toBeInTheDocument();
  });

  it('enforces the password policy and confirms a valid reset', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    const password = await screen.findByLabelText('New password');
    const confirmation = screen.getByLabelText('Confirm password');
    await user.type(password, 'lowercase1');
    await user.type(confirmation, 'lowercase1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/one uppercase letter/);

    await user.clear(password);
    await user.clear(confirmation);
    await user.type(password, 'Secure123');
    await user.type(confirmation, 'Secure123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    await waitFor(() => expect(confirmReset).toHaveBeenCalledWith({}, 'valid-code', 'Secure123'));
    expect(screen.getByText('Password updated')).toBeInTheDocument();
  });
});
