import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminFeedbackPage from '@/app/admin/feedback/page';

const { authenticatedFetch, toastSuccess, toastError } = vi.hoisted(() => ({
  authenticatedFetch: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/firebase/authenticated-fetch', () => ({ authenticatedFetch }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }));

const pending = {
  id: 'pending-1', name: 'Pending Visitor', email: 'pending@example.com',
  message: 'This feedback is waiting for administrator review.', status: 'pending',
  createdAt: '2026-08-10T10:00:00.000Z', approvedAt: null, approvedBy: null,
  isRecommended: false,
};
const approved = {
  ...pending, id: 'approved-1', name: 'Approved Visitor', email: 'approved@example.com',
  status: 'approved', approvedAt: '2026-08-11T10:00:00.000Z', approvedBy: 'admin-uid',
};

describe('Admin feedback moderation page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('scrollTo', vi.fn());
    authenticatedFetch.mockImplementation((input: string, init?: RequestInit) => {
      if (init?.method === 'PATCH' || init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: vi.fn().mockResolvedValue({ success: true, message: 'Updated' }) });
      }
      const isApproved = input.includes('status=approved');
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          feedback: isApproved ? [approved] : [pending],
          pagination: { limit: 10, hasMore: false, nextCursor: null },
          recommendedCount: 0,
        }),
      });
    });
  });

  it('uses independent cursor pagination with 10 records per page', async () => {
    authenticatedFetch.mockImplementation((input: string) => Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        feedback: [pending],
        pagination: input.includes('cursor=next-cursor')
          ? { limit: 10, hasMore: false, nextCursor: null }
          : { limit: 10, hasMore: true, nextCursor: 'next-cursor' },
        recommendedCount: 0,
      }),
    }));
    const user = userEvent.setup();
    render(<AdminFeedbackPage />);
    await screen.findByText('Pending Visitor');
    expect(screen.getByText('Page 1 · 10 per page')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining('cursor=next-cursor'),
      { cache: 'no-store' }
    ));
    expect(screen.getByText('Page 2 · 10 per page')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('shows pending and approved feedback in separate tabs', async () => {
    const user = userEvent.setup();
    render(<AdminFeedbackPage />);
    expect(await screen.findByText('Pending Visitor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Approved/ }));
    expect(screen.getByText('Approved Visitor')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Recommend feedback from Approved Visitor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('sends the recommendation action through the protected API', async () => {
    const user = userEvent.setup();
    render(<AdminFeedbackPage />);
    await screen.findByText('Pending Visitor');
    await user.click(screen.getByRole('tab', { name: /Approved/ }));
    await user.click(screen.getByRole('switch', { name: 'Recommend feedback from Approved Visitor' }));
    await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledWith(
      '/api/admin/feedback/approved-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ action: 'recommend', isRecommended: true }),
      })
    ));
  });
});
