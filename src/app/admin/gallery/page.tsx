'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageCard, type GalleryImageItem } from './_components/ImageCard';
import { AddImageModal } from './_components/AddImageModal';
import { DeleteConfirmModal } from './_components/DeleteConfirmModal';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

// ─── Bento grid class per index ───────────────────────────────────────────────
// Pattern repeats every 4 items (desktop only):
//   0 → row-span-2  (tall left)
//   3 → col-span-2  (wide right)
//   1,2 → normal
function bentoClass(i: number): string {
  const pos = i % 4;
  if (pos === 0) return 'lg:row-span-2';
  if (pos === 3) return 'lg:col-span-2';
  return '';
}

// On mobile, first image is full-width; others are in 2-col grid
function mobileClass(i: number): string {
  return i === 0 ? 'col-span-2 h-52' : 'h-40';
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-[#E0E0E0] animate-pulse', className)} />
  );
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GalleryImageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImageItem | null>(null);

  // Fetch gallery images
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gallery', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setImages(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently fail; user sees empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // Handlers
  const handleAdded = (img: GalleryImageItem) => {
    setImages((prev) => [img, ...prev]); // prepend (most recent first)
    setAddOpen(false);
  };

  const handleEdited = (img: GalleryImageItem) => {
    setImages((prev) => prev.map((p) => (p.id === img.id ? img : p)));
    setEditTarget(null);
  };

  const handleDeleted = (id: string) => {
    setImages((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: FONT }}>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-family-body text-[#212121]">Gallery</h1>
          <p className="text-sm text-[#9E9E9E] mt-0.5">
            Manage{' '}
            <span className="text-[#2E7D32] font-medium">high-quality</span>
            {' '}images for your listings.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-10 px-4 py-2 text-sm font-medium text-white bg-[#2E7D32] rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <ImagePlus className="w-4 h-4" />
          <span className='hidden md:block'>Add Image</span>
        </button>
      </div>

      {/* Gallery grid */}
      {loading ? (
        /* Skeleton */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:auto-rows-[220px]">
          <SkeletonCard className="col-span-2 h-52 lg:col-span-1 lg:row-span-2 lg:h-auto" />
          <SkeletonCard className="h-40 lg:h-auto" />
          <SkeletonCard className="h-40 lg:h-auto" />
          <SkeletonCard className="col-span-2 h-40 lg:h-auto" />
          <SkeletonCard className="h-40 lg:h-auto" />
          <SkeletonCard className="h-40 lg:h-auto" />
        </div>
      ) : images.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center">
            <Images className="w-8 h-8 text-[#2E7D32]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#212121]">No images yet</p>
            <p className="text-sm text-[#9E9E9E] mt-1">
              Click <span className="font-medium text-[#2E7D32]">Add Image</span> to upload your first photo.
            </p>
          </div>
        </div>
      ) : (
        /* Bento grid */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:auto-rows-[220px]">
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              className={cn(mobileClass(i), bentoClass(i), 'lg:h-auto')}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <AddImageModal
          onClose={() => setAddOpen(false)}
          onSaved={handleAdded}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <AddImageModal
          editImage={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEdited}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          image={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
