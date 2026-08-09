import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackClient } from './FeedbackClient';

afterEach(() => vi.restoreAllMocks());

describe('FeedbackClient', () => {
  it('shows the empty state, counter, and long-story link', () => {
    render(<FeedbackClient initialFeedback={[]} />);
    expect(screen.getByText('0/500')).toBeInTheDocument();
    expect(screen.getByText('Be the first to share')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /write your story/i })).toHaveAttribute('href', '/blog/submit');
  });

  it('expands a longer visitor review with a read more control', async () => {
    const user = userEvent.setup();
    const message = 'This is a beautifully calm visit '.repeat(8);
    render(
      <FeedbackClient
        initialFeedback={[{ id: 'long-review', name: 'A Visitor', message, createdAt: '2026-04-21T00:00:00.000Z' }]}
      />
    );
    const readMore = screen.getByRole('button', { name: 'Read more' });
    expect(readMore).toHaveAttribute('aria-expanded', 'false');
    await user.click(readMore);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('validates the feedback minimum before sending', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    render(<FeedbackClient initialFeedback={[]} />);
    await user.type(screen.getByLabelText(/full name/i), 'Visitor');
    await user.type(screen.getByLabelText(/email address/i), 'visitor@example.com');
    await user.type(screen.getByLabelText(/your feedback/i), 'Too short');
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    expect(await screen.findByText(/at least 20 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits once and renders the review success state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, id: 'one', status: 'pending' }), { status: 201 })
    );
    const user = userEvent.setup();
    render(<FeedbackClient initialFeedback={[]} />);
    await user.type(screen.getByLabelText(/full name/i), 'Visitor');
    await user.type(screen.getByLabelText(/email address/i), 'visitor@example.com');
    await user.type(screen.getByLabelText(/your feedback/i), 'This was a wonderfully peaceful visit.');
    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await waitFor(() => expect(screen.getByText('Feedback received')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
