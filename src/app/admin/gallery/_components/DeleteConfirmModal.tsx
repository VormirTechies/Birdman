'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { GalleryImageItem } from './ImageCard';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

interface DeleteConfirmModalProps {
  image: GalleryImageItem;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteConfirmModal({ image, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/gallery/${image.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: image.url }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete image.');
        return;
      }
      onDeleted(image.id);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        style={{ fontFamily: FONT }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFEBEE] flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-[#D32F2F]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#212121]">Delete Image</h2>
            <p className="text-xs text-[#9E9E9E] mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-[#616161]">
          Are you sure you want to delete{' '}
          <span className="font-medium text-[#212121]">
            {image.altText ?? 'this image'}
          </span>
          ? It will be removed from both the gallery and storage.
        </p>

        {error && (
          <p className="text-xs text-[#D32F2F] bg-[#FFEBEE] px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-[#E0E0E0] text-sm font-medium text-[#616161] hover:bg-[#F5F5F5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="h-10 px-5 rounded-xl bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
