/**
 * Gallery Page Tests
 *
 * Tests the admin gallery page including:
 * - Page rendering and initial state
 * - Loading skeleton display
 * - Empty state when no images exist
 * - Image grid after successful fetch
 * - Add Image modal open/close
 * - Image prepended to grid after add
 * - Edit modal open/close
 * - Image updated in grid after edit
 * - Delete modal open/close
 * - Image removed from grid after delete
 * - API error handled gracefully (shows empty state)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryPage from '@/app/admin/gallery/page';
import type { GalleryImageItem } from '@/app/admin/gallery/_components/ImageCard';

// ─── Mock child components ────────────────────────────────────────────────────

vi.mock('@/app/admin/gallery/_components/ImageCard', () => ({
  ImageCard: ({ image, onEdit, onDelete }: any) => (
    <div data-testid={`image-card-${image.id}`}>
      <span data-testid={`card-title-${image.id}`}>{image.altText}</span>
      <button data-testid={`edit-btn-${image.id}`} onClick={() => onEdit(image)}>
        Edit
      </button>
      <button data-testid={`delete-btn-${image.id}`} onClick={() => onDelete(image)}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('@/app/admin/gallery/_components/AddImageModal', () => ({
  AddImageModal: ({ editImage, onClose, onSaved }: any) => (
    <div data-testid="add-image-modal">
      <span data-testid="modal-mode">{editImage ? 'edit' : 'add'}</span>
      {editImage && (
        <span data-testid="modal-edit-id">{editImage.id}</span>
      )}
      <button
        data-testid="modal-save"
        onClick={() =>
          onSaved(
            editImage
              ? { ...editImage, altText: 'Updated Title' }
              : {
                  id: 'new-img-1',
                  url: 'https://example.com/new.jpg',
                  altText: 'New Image',
                  caption: null,
                  uploadedAt: new Date().toISOString(),
                }
          )
        }
      >
        Save
      </button>
      <button data-testid="modal-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/app/admin/gallery/_components/DeleteConfirmModal', () => ({
  DeleteConfirmModal: ({ image, onClose, onDeleted }: any) => (
    <div data-testid="delete-confirm-modal">
      <span data-testid="delete-modal-id">{image.id}</span>
      <button data-testid="confirm-delete" onClick={() => onDeleted(image.id)}>
        Confirm Delete
      </button>
      <button data-testid="cancel-delete" onClick={onClose}>
        Cancel
      </button>
    </div>
  ),
}));

// ─── Sample data helpers ──────────────────────────────────────────────────────

const makeImage = (id: string, overrides: Partial<GalleryImageItem> = {}): GalleryImageItem => ({
  id,
  url: `https://example.com/${id}.jpg`,
  altText: `Title ${id}`,
  caption: `Caption ${id}`,
  uploadedAt: new Date().toISOString(),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Gallery Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty gallery
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the page heading', async () => {
      render(<GalleryPage />);
      await waitFor(() => {
        expect(screen.getByText('Gallery')).toBeInTheDocument();
      });
    });

    it('renders the Add Image button', async () => {
      render(<GalleryPage />);
      expect(screen.getByRole('button', { name: /add image/i })).toBeInTheDocument();
    });

    it('renders the subtitle text', async () => {
      render(<GalleryPage />);
      expect(screen.getByText(/high-quality/i)).toBeInTheDocument();
    });
  });

  // ── Loading skeleton ─────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows skeleton while fetching', () => {
      // Keep fetch pending
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

      const { container } = render(<GalleryPage />);
      // Skeleton cards have animate-pulse class
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides skeleton after fetch completes', async () => {
      render(<GalleryPage />);
      await waitFor(() => {
        expect(screen.queryByText(/no images yet/i)).toBeInTheDocument();
      });
    });
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  describe('Empty state', () => {
    it('shows empty state message when no images', async () => {
      render(<GalleryPage />);
      await waitFor(() => {
        expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
      });
    });

    it('shows Add Image hint in empty state', async () => {
      render(<GalleryPage />);
      await waitFor(() => {
        expect(screen.getByText(/add image/i)).toBeInTheDocument();
      });
    });

    it('does not show image cards in empty state', async () => {
      render(<GalleryPage />);
      await waitFor(() => {
        expect(screen.queryByTestId(/^image-card-/)).not.toBeInTheDocument();
      });
    });
  });

  // ── Data display ─────────────────────────────────────────────────────────

  describe('Image grid', () => {
    it('renders image cards for each fetched image', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img1'), makeImage('img2'), makeImage('img3')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('image-card-img1')).toBeInTheDocument();
        expect(screen.getByTestId('image-card-img2')).toBeInTheDocument();
        expect(screen.getByTestId('image-card-img3')).toBeInTheDocument();
      });
    });

    it('does not show empty state when images are present', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img1')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.queryByText(/no images yet/i)).not.toBeInTheDocument();
      });
    });

    it('fetches from /api/admin/gallery on mount', async () => {
      render(<GalleryPage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/gallery', { cache: 'no-store' });
      });
    });

    it('handles non-array API response gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'Unexpected response' }),
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
      });
    });

    it('handles failed fetch response gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
      });
    });

    it('handles network error gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
      });
    });
  });

  // ── Add Image modal ───────────────────────────────────────────────────────

  describe('Add Image modal', () => {
    it('opens add modal when Add Image button is clicked', async () => {
      const user = userEvent.setup();
      render(<GalleryPage />);

      await user.click(screen.getByRole('button', { name: /add image/i }));

      expect(screen.getByTestId('add-image-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-mode').textContent).toBe('add');
    });

    it('closes add modal when close is clicked', async () => {
      const user = userEvent.setup();
      render(<GalleryPage />);

      await user.click(screen.getByRole('button', { name: /add image/i }));
      expect(screen.getByTestId('add-image-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('modal-close'));
      expect(screen.queryByTestId('add-image-modal')).not.toBeInTheDocument();
    });

    it('prepends new image to grid after save', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('existing-1')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('image-card-existing-1')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add image/i }));
      await user.click(screen.getByTestId('modal-save'));

      await waitFor(() => {
        expect(screen.getByTestId('image-card-new-img-1')).toBeInTheDocument();
        // New image also present alongside old one
        expect(screen.getByTestId('image-card-existing-1')).toBeInTheDocument();
      });
    });

    it('closes modal after image is saved', async () => {
      const user = userEvent.setup();
      render(<GalleryPage />);

      await user.click(screen.getByRole('button', { name: /add image/i }));
      await user.click(screen.getByTestId('modal-save'));

      await waitFor(() => {
        expect(screen.queryByTestId('add-image-modal')).not.toBeInTheDocument();
      });
    });
  });

  // ── Edit modal ────────────────────────────────────────────────────────────

  describe('Edit modal', () => {
    it('opens edit modal with correct image when edit is clicked', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-edit')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-img-edit')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-btn-img-edit'));

      expect(screen.getByTestId('add-image-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-mode').textContent).toBe('edit');
      expect(screen.getByTestId('modal-edit-id').textContent).toBe('img-edit');
    });

    it('updates the image in place after save', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-edit', { altText: 'Original Title' })],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('card-title-img-edit').textContent).toBe('Original Title');
      });

      await user.click(screen.getByTestId('edit-btn-img-edit'));
      await user.click(screen.getByTestId('modal-save'));

      await waitFor(() => {
        expect(screen.getByTestId('card-title-img-edit').textContent).toBe('Updated Title');
      });
    });

    it('closes edit modal when close is clicked', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-edit')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-img-edit')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-btn-img-edit'));
      await user.click(screen.getByTestId('modal-close'));

      expect(screen.queryByTestId('add-image-modal')).not.toBeInTheDocument();
    });
  });

  // ── Delete modal ──────────────────────────────────────────────────────────

  describe('Delete modal', () => {
    it('opens delete confirm modal when delete is clicked', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-del')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-img-del')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-btn-img-del'));

      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
      expect(screen.getByTestId('delete-modal-id').textContent).toBe('img-del');
    });

    it('removes image from grid after delete is confirmed', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-del'), makeImage('img-keep')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('image-card-img-del')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-btn-img-del'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.queryByTestId('image-card-img-del')).not.toBeInTheDocument();
        expect(screen.getByTestId('image-card-img-keep')).toBeInTheDocument();
      });
    });

    it('closes delete modal after deletion', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-del')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-img-del')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-btn-img-del'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
      });
    });

    it('keeps image in grid when delete is cancelled', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img-del')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-img-del')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-btn-img-del'));
      await user.click(screen.getByTestId('cancel-delete'));

      expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('image-card-img-del')).toBeInTheDocument();
    });

    it('shows empty state after last image is deleted', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('only-img')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-only-img')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-btn-only-img'));
      await user.click(screen.getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
      });
    });
  });

  // ── Only one modal open at a time ─────────────────────────────────────────

  describe('Modal exclusivity', () => {
    it('does not show both add and delete modal simultaneously', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeImage('img1')],
      });

      render(<GalleryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-img1')).toBeInTheDocument();
      });

      // Open delete modal
      await user.click(screen.getByTestId('delete-btn-img1'));
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('add-image-modal')).not.toBeInTheDocument();
    });
  });
});
