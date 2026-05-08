'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export interface CarouselProps {
  images: string[];
  interval?: number; // Auto-play interval in milliseconds (default: 5000)
  className?: string;
}

export default function Carousel({ images, interval = 5000, className = '' }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  // Auto-play
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [goToNext, interval, images.length]);

  if (!images.length) {
    return null;
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Image
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              suppressHydrationWarning
            />
          ))}
        </div>
      )}
    </div>
  );
}
