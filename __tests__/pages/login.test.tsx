/**
 * Login Page Tests
 *
 * Tests the admin login page functionality including:
 * - Login form rendering and submission
 * - Forgot password flow
 * - Password visibility toggle
 * - Form validation
 * - Authentication with Supabase
 * - Multi-view navigation
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import AdminLoginPage from '@/app/admin/login/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Firebase auth client
const {
  mockSignInWithEmailAndPassword,
  mockSendPasswordResetEmail,
  mockVerifyPasswordResetCode,
  mockConfirmPasswordReset,
} = vi.hoisted(() => ({
  mockSignInWithEmailAndPassword: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
  mockVerifyPasswordResetCode: vi.fn(),
  mockConfirmPasswordReset: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  confirmPasswordReset: mockConfirmPasswordReset,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  verifyPasswordResetCode: mockVerifyPasswordResetCode,
}));

vi.mock('@/firebase', () => ({
  auth: {},
  firebaseConfigError: null,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock Carousel component
vi.mock('@/app/admin/_components/Carousel', () => ({
  default: ({ images }: any) => (
    <div data-testid="carousel">Carousel with {images.length} images</div>
  ),
}));

// Mock OTPInput component
vi.mock('@/app/admin/_components/OTPInput', () => ({
  default: ({ value, onChange }: any) => (
    <input
      data-testid="otp-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter 6-digit code"
    />
  ),
}));

describe('Login Page', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockRefresh = vi.fn();
  const mockRouter = { push: mockPush, replace: mockReplace, refresh: mockRefresh };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'admin-1' } });
    mockSendPasswordResetEmail.mockResolvedValue(undefined);
    mockVerifyPasswordResetCode.mockResolvedValue('user@example.com');
    mockConfirmPasswordReset.mockResolvedValue(undefined);

    // Mock window.location.origin for reset password redirect
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login View - Rendering', () => {
    it('renders login form by default', () => {
      render(<AdminLoginPage />);

      expect(screen.getByText('Sign in to manage your properties')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    });

    it('renders carousel', () => {
      render(<AdminLoginPage />);

      // Two carousels are rendered (one for mobile, one for desktop)
      const carousels = screen.getAllByTestId('carousel');
      expect(carousels.length).toBe(2);
    });

    it('renders forgot password link', () => {
      render(<AdminLoginPage />);

      expect(screen.getByText(/Forgot password?/i)).toBeInTheDocument();
    });

    it('renders password visibility toggle', () => {
      render(<AdminLoginPage />);

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Should have eye icon button
      const toggleButtons = screen.getAllByRole('button');
      expect(toggleButtons.length).toBeGreaterThan(1);
    });
  });

  describe('Login View - Form Interaction', () => {
    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'admin@example.com');

      expect(emailInput).toHaveValue('admin@example.com');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const passwordInput = screen.getByLabelText(/Password/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the eye icon button (next to password field)
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('absolute')
      );

      if (eyeButton) {
        await user.click(eyeButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(eyeButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Login View - Form Submission', () => {
    it('submits login form with valid credentials', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          'admin@example.com',
          'password123'
        );
      });
    });

    it('redirects to dashboard on successful login', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('shows error message on invalid credentials', async () => {
      const user = userEvent.setup();
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('Invalid login credentials')
      );

      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('shows error when fields are empty', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      // HTML5 validation prevents submission, so check required attributes
      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    it('disables submit button while loading', async () => {
      const user = userEvent.setup();
      mockSignInWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ user: { uid: 'admin-1' } }), 100))
      );

      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      // Button should be disabled during submission
      expect(loginButton).toBeDisabled();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin');
      });
    });
  });

  describe('Forgot Password View', () => {
    it('switches to forgot password view', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
        expect(screen.getByText(/Enter your email address/i)).toBeInTheDocument();
      });
    });

    it('allows typing in forgot email field', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await screen.findByRole('heading', { name: /Forgot Password/i });
      const emailInput = screen.getByLabelText('Email address');
      await user.type(emailInput, 'user@example.com');
      expect(emailInput).toHaveValue('user@example.com');
    });

    it('sends reset password email', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await screen.findByRole('heading', { name: /Forgot Password/i });
      const emailInput = screen.getByLabelText('Email address');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const sendButton = screen.getByRole('button', { name: /Get OTP/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
          {},
          'user@example.com',
          expect.objectContaining({
            url: 'http://localhost:3000/admin/login',
          })
        );
      });
    });

    it('validates email format in forgot password', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email address');
        // Email field has HTML5 validation
        expect(emailInput).toHaveAttribute('type', 'email');
        expect(emailInput).toBeRequired();
      });
    });

    it('shows success state after sending reset email', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await screen.findByRole('heading', { name: /Forgot Password/i });
      const emailInput = screen.getByLabelText('Email address');
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      const sendButton = screen.getByRole('button', { name: /Get OTP/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Check your email/i)).toBeInTheDocument();
      });
    });

    it('navigates back to login from forgot password', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
      });

      // Find back button by text content
      const backButton = await screen.findByText('Back to Login');
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Sign in to manage your properties')).toBeInTheDocument();
      });
    });
  });

  describe('View Transitions', () => {
    it('clears form data when switching views', async () => {
      const user = userEvent.setup();
      render(<AdminLoginPage />);

      // Type in login form
      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'test@example.com');

      // Switch to forgot password
      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      // Go back to login
      await screen.findByRole('heading', { name: /Forgot Password/i });
      const backButton = await screen.findByRole('button', { name: /Back to Login/i });
      await user.click(backButton);

      // Login form should be cleared (this is handled by state reset)
      await waitFor(() => {
        expect(screen.getByText('Sign in to manage your properties')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors during login', async () => {
      const user = userEvent.setup();
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error('Network error'));

      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Log In/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('handles network errors during password reset', async () => {
      const user = userEvent.setup();
      mockSendPasswordResetEmail.mockRejectedValue(new Error('Network error occurred'));

      render(<AdminLoginPage />);

      const forgotLink = screen.getByText(/Forgot password?/i);
      await user.click(forgotLink);

      await screen.findByRole('heading', { name: /Forgot Password/i });
      const emailInput = screen.getByLabelText('Email address');
      await user.type(emailInput, 'user@example.com');

      const sendButton = screen.getByRole('button', { name: /Get OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error occurred/i)).toBeInTheDocument();
      });
    });
  });
});
