'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { LoadingSkeleton } from '@/components/atoms/Loading';
import { cn } from '@/lib/utils';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

interface GalleryGridProps {
  images: GalleryImage[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

export function GalleryGrid({ images, loading = false, columns = 3 }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-4',
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          columns === 4 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'grid gap-4',
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          columns === 4 && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        )}
      >
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-mist-white hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-parakeet-green focus:ring-offset-2"
            aria-label={`View larger image: ${image.alt}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-deep-night/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-deep-night/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-sunset-gold transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm px-4">
            {selectedImage.alt}
          </p>
        </div>
      )}
    </>
  );
}
