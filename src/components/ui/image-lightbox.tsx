'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (open) {
      // Use requestAnimationFrame to avoid "cascading render" react warning
      const frame = requestAnimationFrame(() => {
        setIndex(initialIndex);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [initialIndex, open]);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') onOpenChange(false);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* Full screen backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        
        {/* Full screen centered content */}
        <DialogPrimitive.Content
          className="fixed inset-0 z-100 flex flex-col items-center justify-center outline-none w-screen h-screen text-white select-none"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">
            {current.caption || current.alt || 'Image Preview'}
          </DialogTitle>
          
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-10 lg:p-16">
            {/* Close Button */}
            <DialogPrimitive.Close asChild>
              <button
                className="absolute top-4 right-4 z-50 text-white/50 hover:text-white p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all active:scale-90"
                aria-label="Close lightbox"
              >
                <X className="w-6 h-6" />
              </button>
            </DialogPrimitive.Close>

            {/* Image Counter */}
            <div className="absolute top-4 left-4 z-50 text-white/60 text-xs font-medium bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 tracking-wider">
              {index + 1} / {images.length}
            </div>

            {/* Previous Button */}
            {images.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-4 z-50 text-white/40 hover:text-white p-4 rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-sm transition-all active:scale-90 group"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}

            {/* Main Image Viewport */}
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={current.src}
                    alt={current.alt}
                    fill
                    className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                    sizes="100vw"
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-4 z-50 text-white/40 hover:text-white p-4 rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-sm transition-all active:scale-90 group"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Caption Overlay */}
            {current.caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-white/95 text-sm md:text-base font-medium bg-black/60 backdrop-blur-xl px-10 py-3.5 rounded-full border border-white/20 shadow-2xl max-w-[85vw] md:max-w-2xl text-center leading-relaxed">
                  {current.caption}
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
