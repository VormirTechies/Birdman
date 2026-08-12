import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class FeedbackNotFoundError extends Error {}
  class FeedbackRecommendationLimitError extends Error {}
  class InvalidFeedbackStateError extends Error {}
  class InvalidFeedbackCursorError extends Error {}
  return {
    requireAdmin: vi.fn(),
    listAdminFirestoreFeedbackPage: vi.fn(),
    countRecommendedFirestoreFeedback: vi.fn(),
    approveFirestoreFeedback: vi.fn(),
    deleteFirestoreFeedback: vi.fn(),
    setFirestoreFeedbackRecommended: vi.fn(),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    FeedbackNotFoundError,
    FeedbackRecommendationLimitError,
    InvalidFeedbackStateError,
    InvalidFeedbackCursorError,
  };
});

vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath, revalidateTag: mocks.revalidateTag }));
vi.mock('@/lib/firebase/feedback', () => ({
  listAdminFirestoreFeedbackPage: mocks.listAdminFirestoreFeedbackPage,
  countRecommendedFirestoreFeedback: mocks.countRecommendedFirestoreFeedback,
  approveFirestoreFeedback: mocks.approveFirestoreFeedback,
  deleteFirestoreFeedback: mocks.deleteFirestoreFeedback,
  setFirestoreFeedbackRecommended: mocks.setFirestoreFeedbackRecommended,
  FeedbackNotFoundError: mocks.FeedbackNotFoundError,
  FeedbackRecommendationLimitError: mocks.FeedbackRecommendationLimitError,
  InvalidFeedbackStateError: mocks.InvalidFeedbackStateError,
  InvalidFeedbackCursorError: mocks.InvalidFeedbackCursorError,
}));

import { GET } from '@/app/api/admin/feedback/route';
import { DELETE, PATCH } from '@/app/api/admin/feedback/[id]/route';

const context = { params: Promise.resolve({ id: 'feedback-1' }) };
const admin = { user: { uid: 'admin-uid' }, response: null };

describe('admin feedback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue(admin);
    mocks.countRecommendedFirestoreFeedback.mockResolvedValue(2);
  });

  it('returns a default 10-record cursor page for the selected tab', async () => {
    mocks.listAdminFirestoreFeedbackPage.mockResolvedValue({ feedback: [{ id: 'p1' }], hasMore: true, nextCursor: 'next' });
    const response = await GET(new Request('http://localhost/api/admin/feedback?status=pending'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      feedback: [{ id: 'p1' }],
      pagination: { limit: 10, hasMore: true, nextCursor: 'next' },
      recommendedCount: 2,
    });
    expect(mocks.listAdminFirestoreFeedbackPage).toHaveBeenCalledWith('pending', 10, undefined);
  });

  it('approves pending feedback and revalidates public pages', async () => {
    const response = await PATCH(new Request('http://localhost/api/admin/feedback/feedback-1', {
      method: 'PATCH', body: JSON.stringify({ action: 'approve' }),
    }) as never, context);
    expect(response.status).toBe(200);
    expect(mocks.approveFirestoreFeedback).toHaveBeenCalledWith('feedback-1', 'admin-uid');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/feedback');
  });

  it('sets recommendation state and reports the five-item limit', async () => {
    const request = () => new Request('http://localhost/api/admin/feedback/feedback-1', {
      method: 'PATCH', body: JSON.stringify({ action: 'recommend', isRecommended: true }),
    });
    let response = await PATCH(request() as never, context);
    expect(response.status).toBe(200);
    expect(mocks.setFirestoreFeedbackRecommended).toHaveBeenCalledWith('feedback-1', true);

    mocks.setFirestoreFeedbackRecommended.mockRejectedValueOnce(new mocks.FeedbackRecommendationLimitError('limit'));
    response = await PATCH(request() as never, context);
    expect(response.status).toBe(409);
  });

  it('deletes rejected or approved feedback', async () => {
    const response = await DELETE(new Request('http://localhost/api/admin/feedback/feedback-1', { method: 'DELETE' }) as never, context);
    expect(response.status).toBe(200);
    expect(mocks.deleteFirestoreFeedback).toHaveBeenCalledWith('feedback-1');
  });
});
