import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createFirestoreFeedback: vi.fn(),
  listApprovedFirestoreFeedbackPage: vi.fn(),
}));
vi.mock('@/lib/firebase/feedback', () => ({
  createFirestoreFeedback: mocks.createFirestoreFeedback,
  listApprovedFirestoreFeedbackPage: mocks.listApprovedFirestoreFeedbackPage,
  InvalidFeedbackCursorError: class InvalidFeedbackCursorError extends Error {},
}));

import { GET, POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const valid = { name: 'Visitor Name', email: 'VISITOR@example.com', feedback: 'A memorable and peaceful visit.', website: '' };

describe('POST /api/feedback', () => {
  beforeEach(() => {
    mocks.createFirestoreFeedback.mockReset();
    mocks.createFirestoreFeedback.mockResolvedValue({ id: 'feedback-1', status: 'pending' });
  });

  it('creates normalized pending feedback and returns a safe response', async () => {
    const response = await POST(request(valid) as never);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ success: true, id: 'feedback-1', status: 'pending' });
    expect(mocks.createFirestoreFeedback).toHaveBeenCalledWith({ ...valid, email: 'visitor@example.com' });
  });

  it('rejects invalid and server-owned fields', async () => {
    const response = await POST(request({ ...valid, status: 'approved' }) as never);
    expect(response.status).toBe(400);
    expect(mocks.createFirestoreFeedback).not.toHaveBeenCalled();
  });

  it('accepts a honeypot submission without writing it', async () => {
    const response = await POST(request({ ...valid, website: 'https://spam.example' }) as never);
    expect(response.status).toBe(201);
    expect(mocks.createFirestoreFeedback).not.toHaveBeenCalled();
  });

  it('returns a structured error when Firestore fails', async () => {
    mocks.createFirestoreFeedback.mockRejectedValue(new Error('offline'));
    const response = await POST(request(valid) as never);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});

describe('GET /api/feedback', () => {
  it('returns only the approved public feedback DTO', async () => {
    const publicFeedback = [{
      id: 'feedback-1',
      name: 'Visitor',
      message: 'A peaceful and memorable sanctuary visit.',
      createdAt: '2026-08-09T10:00:00.000Z',
    }];
    mocks.listApprovedFirestoreFeedbackPage.mockResolvedValue({
      feedback: publicFeedback,
      hasMore: true,
      nextCursor: 'next-page',
    });

    const response = await GET(
      new Request('http://localhost/api/feedback?limit=10') as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      feedback: publicFeedback,
      pagination: { limit: 10, hasMore: true, nextCursor: 'next-page' },
    });
    expect(mocks.listApprovedFirestoreFeedbackPage).toHaveBeenCalledWith(10, undefined);
    expect(JSON.stringify(publicFeedback)).not.toContain('email');
  });

  it('caps the requested limit at 50', async () => {
    mocks.listApprovedFirestoreFeedbackPage.mockResolvedValue({
      feedback: [], hasMore: false, nextCursor: null,
    });
    await GET(new Request('http://localhost/api/feedback?limit=500') as never);
    expect(mocks.listApprovedFirestoreFeedbackPage).toHaveBeenCalledWith(50, undefined);
  });
});
