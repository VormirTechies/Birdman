'use client';

import { motion } from 'framer-motion';
import { GalleryGrid } from './GalleryGrid';
import type { GalleryImage } from '@/types';

interface GallerySectionProps {
  images?: GalleryImage[];
  loading?: boolean;
}

// Mock images for now
const mockImages: GalleryImage[] = [
  {
    id: '1',
    url: '/images/gallery/001.jpeg',
    alt: 'Thousands of parakeets gathering at the sanctuary',
    width: 800,
    height: 600,
  },
  {
    id: '2',
    url: '/images/gallery/002.jpeg',
    alt: 'Mr. Sudarson feeding the birds',
    width: 600,
    height: 800,
  },
  {
    id: '3',
    url: '/images/gallery/003.jpeg',
    alt: 'Close-up of parakeets on the rooftop',
    width: 800,
    height: 600,
  },
  {
    id: '4',
    url: '/images/gallery/004.jpeg',
    alt: 'Evening feeding session with golden light',
    width: 800,
    height: 600,
  },
  {
    id: '5',
    url: '/images/gallery/005.jpeg',
    alt: 'Parakeets in flight during feeding time',
    width: 600,
    height: 800,
  },
  {
    id: '6',
    url: '/images/gallery/006.jpeg',
    alt: 'The sanctuary rooftop view',
    width: 800,
    height: 600,
  },
];

export function GallerySection({ images = mockImages, loading = false }: GallerySectionProps) {
  return (
    <section id="gallery" className="py-16 md:py-24 bg-mist-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night mb-4">
            Moments from the Sanctuary
          </h2>
          <p className="text-deep-night/70 text-lg max-w-2xl mx-auto">
            Experience the magic through photos captured during feeding sessions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <GalleryGrid images={images} loading={loading} columns={3} />
        </motion.div>
      </div>
    </section>
  );
}
