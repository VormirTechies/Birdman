'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

export interface GalleryImageItem {
  id: string;
  url: string;
  altText: string | null;   // title
  caption: string | null;   // description
  uploadedAt: string;
}

interface ImageCardProps {
  image: GalleryImageItem;
  onEdit: (image: GalleryImageItem) => void;
  onDelete: (image: GalleryImageItem) => void;
  className?: string;
}

export function ImageCard({ image, onEdit, onDelete, className }: ImageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-[#212121] group cursor-pointer',
        className
      )}
    >
      {/* Image */}
      <Image
        src={image.url}
        alt={image.altText ?? 'Gallery image'}
        fill
        unoptimized
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Bottom gradient + text */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
        {image.altText && (
          <p
            className="text-white font-semibold text-sm leading-tight line-clamp-1"
            style={{ fontFamily: FONT }}
          >
            {image.altText}
          </p>
        )}
        {image.caption && (
          <p
            className="text-white/75 text-xs leading-tight mt-0.5 line-clamp-2"
            style={{ fontFamily: FONT }}
          >
            {image.caption}
          </p>
        )}
      </div>

      {/* 3-dot menu */}
      <div
        ref={menuRef}
        className="absolute top-2 right-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm"
          aria-label="Image options"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="absolute right-0 top-9 w-36 rounded-xl bg-white shadow-lg border border-[#E0E0E0] py-1 z-20"
            style={{ fontFamily: FONT }}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit(image); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#212121] hover:bg-[#F5F5F5] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-[#616161]" />
              Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(image); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#D32F2F] hover:bg-[#FFEBEE] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#D32F2F]" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
