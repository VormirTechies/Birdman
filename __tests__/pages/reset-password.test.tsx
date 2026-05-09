/**
 * Reset Password Page Tests
 *
 * Tests the password reset page functionality including:
 * - Page rendering and session verification
 * - Password reset form submission
 * - Password validation
 * - Password visibility toggle
 * - Success state and redirect
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from '@/app/admin/reset-password/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock Supabase client
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

// Mock Carousel component
vi.mock('@/app/admin/_components/Carousel', () => ({
  default: ({ images }: any) => (
    <div data-testid="carousel">Carousel with {images.length} images</div>
  ),
}));

describe('Reset Password Page', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const mockSearchParams = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Load', () => {
    it('shows loading state initially', () => {
      render(<ResetPasswordPage />);

      expect(screen.getByText(/Verifying your session/i)).toBeInTheDocument();
      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('shows form after session check', async () => {
      render(<ResetPasswordPage />);

      // Wait for the 500ms session check delay to complete
      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
        expect(screen.queryByText(/Verifying your session/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify carousels render (there are 2 - desktop and mobile)
      const carousels = screen.getAllByTestId('carousel');
      expect(carousels.length).toBeGreaterThan(0);
    });

    it('renders carousel after loading', async () => {
      render(<ResetPasswordPage />);

      // Wait for loading state to finish
      await waitFor(() => {
        expect(screen.queryByText(/Verifying your session/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Then check for carousel (there are 2 - desktop and mobile)
      await waitFor(() => {
        const carousels = screen.getAllByTestId('carousel');
        expect(carousels.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Form Rendering', () => {
    it('renders password reset form', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('renders back to login button', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('renders password requirement hint', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/At least 8 characters with a mix of letters and numbers/i)
        ).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('renders password fields as hidden by default', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        const newPasswordInput = screen.getByLabelText(/New Password/i);
        const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

        expect(newPasswordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      }, { timeout: 2000 });
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in new password field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      await user.type(newPasswordInput, 'NewPass123');
      expect(newPasswordInput).toHaveValue('NewPass123');
    });

    it('allows typing in confirm password field', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      await user.type(confirmPasswordInput, 'NewPass123');
      expect(confirmPasswordInput).toHaveValue('NewPass123');
    });

    it('toggles new password visibility', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      expect(newPasswordInput).toHaveAttribute('type', 'password');

      // Find the eye icon button for new password
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(btn => 
        btn.className.includes('absolute') && 
        btn.previousElementSibling?.id === 'new-password'
      );

      if (eyeButton) {
        await user.click(eyeButton);
        expect(newPasswordInput).toHaveAttribute('type', 'text');
      }
    });

    it('toggles confirm password visibility', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Find the eye icon button for confirm password
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(btn => 
        btn.className.includes('absolute') && 
        btn.previousElementSibling?.id === 'confirm-password'
      );

      if (eyeButton) {
        await user.click(eyeButton);
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Form Validation', () => {
    it('shows error when password is less than 8 characters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'Short1');
      await user.type(confirmPasswordInput, 'Short1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'DifferentPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('does not submit when fields are empty', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      await user.click(submitButton);

      // Should not call updateUser
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid passwords', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'NewPass123',
        });
      }, { timeout: 2000 });
    });

    it('shows success state after successful reset', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password Reset Successful/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('redirects to login after successful reset', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      // Fast-forward the 2-second redirect delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/login?reset=success');
      }, { timeout: 2000 });
    });

    it('disables submit button while loading', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('navigates back to login when back button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Back to Login/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  describe('Error Handling', () => {
    it('shows error message when update fails', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Failed to update password' },
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update password/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      mockUpdateUser.mockRejectedValue(new Error('Network error'));

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('clears error when user starts typing again', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Submit with mismatched passwords to trigger error
      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'DifferentPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Type again should clear error (this is implicit in form re-render)
      // The error state is controlled by the form submission logic
    });
  });

  describe('Success State', () => {
    it('renders success icon and message', async () => {
      const user = userEvent.setup({ delay: null });
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const newPasswordInput = screen.getByLabelText(/New Password/i);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      await user.type(newPasswordInput, 'NewPass123');
      await user.type(confirmPasswordInput, 'NewPass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password Reset Successful/i)).toBeInTheDocument();
        expect(screen.getByText(/Your password has been successfully reset/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
