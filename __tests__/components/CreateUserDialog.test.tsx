import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserDialog } from '@/app/admin/profile/_components/CreateUserDialog';

const { authenticatedFetch } = vi.hoisted(() => ({ authenticatedFetch: vi.fn() }));
vi.mock('@/lib/firebase/authenticated-fetch', () => ({ authenticatedFetch }));

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

describe('CreateUserDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticatedFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true }) });
  });

  it('validates fields before calling the API', async () => {
    const user = userEvent.setup();
    render(<CreateUserDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Create user' }));
    expect(await screen.findByText(/Display name must be at least 2 characters/)).toBeInTheDocument();
    expect(authenticatedFetch).not.toHaveBeenCalled();
  });

  it('creates an admin account and refreshes the user list', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    render(<CreateUserDialog open onOpenChange={onOpenChange} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Display Name'), 'New Admin');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secure123');
    await user.click(screen.getByRole('switch', { name: 'Administrator access' }));
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalled());
    const [, request] = authenticatedFetch.mock.calls[0];
    expect(JSON.parse(request.body)).toEqual({
      displayName: 'New Admin',
      email: 'new@example.com',
      password: 'Secure123',
      isAdmin: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCreated).toHaveBeenCalled();
  });
});
