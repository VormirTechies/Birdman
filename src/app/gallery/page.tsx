'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Camera, Bird, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/animated-section';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ════════════════════════════════════════════════════════════════════════════
   GALLERY PAGE — Masonry Photo Gallery
   ════════════════════════════════════════════════════════════════════════════ */

type GalleryCategory = 'all' | 'parakeets' | 'birdman' | 'sanctuary';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  category: GalleryCategory[];
  aspect: 'square' | 'landscape' | 'portrait';
}

const galleryImages: GalleryImage[] = [
  { src: '/images/gallery/001.jpeg', alt: 'Parakeet taking flight from the rooftop', caption: 'A single parakeet takes flight at dawn', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/002.jpeg', alt: 'Parakeets gathered on feeding platforms', caption: 'Feeding time at the sanctuary', category: ['parakeets', 'sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/003.jpeg', alt: 'Parakeets feeding on rice and peanuts', caption: 'A feast of rice and peanuts', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/004.jpeg', alt: 'Flock of parakeets on the rooftop', caption: 'Hundreds of parakeets on the feeding platform', category: ['parakeets', 'sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/005.jpeg', alt: 'Close-up of green parakeets eating', caption: 'Rose-ringed parakeets enjoying their meal', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/006.jpeg', alt: 'Parakeets in a large gathering', caption: 'The daily gathering at its peak', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/007.jpeg', alt: 'Parakeet perched on wooden plank', caption: 'A parakeet surveys the rooftop', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/008.jpeg', alt: 'Pair of parakeets', caption: 'A pair of parakeets at golden hour', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/009.jpeg', alt: 'Parakeets in flight', caption: 'Green wings against the evening sky', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/010.jpeg', alt: 'Parakeets at feeding station', caption: 'The feeding station in action', category: ['sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/011.jpeg', alt: 'Large flock of parakeets', caption: 'Thousands gather at once', category: ['parakeets', 'sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/012.jpeg', alt: 'Parakeets on rooftop structures', caption: 'Every surface becomes a gathering spot', category: ['sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/013.jpeg', alt: 'Parakeets at sunset', caption: 'Sunset at the sanctuary', category: ['parakeets', 'sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/014.jpeg', alt: 'Vibrant green parakeets cluster', caption: 'The vibrant green of rose-ringed parakeets', category: ['parakeets'], aspect: 'landscape' },
  { src: '/images/gallery/sudarson-001.png', alt: 'Mr. Sudarson Sah — The Birdman (artistic tribute)', caption: 'The Birdman of Chennai — Artistic tribute', category: ['birdman'], aspect: 'square' },
  { src: '/images/gallery/sudarson-002.jpeg', alt: 'Mr. Sudarson Sah preparing feeding platforms', caption: 'Preparing the feeding platforms at dawn', category: ['birdman', 'sanctuary'], aspect: 'landscape' },
  { src: '/images/gallery/sudarson-003.jpeg', alt: 'Mr. Sudarson Sah portrait', caption: 'Mr. Sudarson Sah', category: ['birdman'], aspect: 'square' },
];

const categories: { value: GalleryCategory; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'parakeets', label: 'Parakeets' },
  { value: 'birdman', label: 'The Birdman' },
  { value: 'sanctuary', label: 'Sanctuary' },
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const filteredImages =
    activeCategory === 'all'
      ? galleryImages
      : galleryImages.filter((img) => img.category.includes(activeCategory));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-0 bg-canopy-dark">
        <div className="container-wide py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <Camera className="w-4 h-4" />
              {galleryImages.length} Photos
            </span>
            <h1 className="font-display font-black text-white text-4xl md:text-5xl lg:text-6xl mb-4">
              The Sanctuary{' '}
              <span className="text-golden-hour">in Pictures</span>
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              A visual journey through the world of 14,000 parakeets and the
              man who welcomes them home every day
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FILTERS ──────────────────────────────────────────────────────── */}
      <section className="bg-feather-cream sticky top-16 md:top-20 z-30 border-b border-sanctuary-green/5">
        <div className="container-wide py-4">
          <Tabs
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v as GalleryCategory)}
          >
            <TabsList className="bg-morning-mist w-full md:w-auto flex gap-1 p-1 rounded-full">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-sanctuary-green data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* ── GALLERY GRID ─────────────────────────────────────────────────── */}
      <section className="py-10 md:py-16 bg-feather-cream">
        <div className="container-wide">
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-5"
          >
            {filteredImages.map((img, i) => (
              <motion.div
                key={img.src}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="break-inside-avoid mb-4 md:mb-5"
              >
                <button
                  onClick={() => openLightbox(i)}
                  className="block w-full group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-sanctuary-green focus-visible:ring-offset-2 rounded-2xl"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-card group-hover:shadow-card-hover transition-shadow duration-300">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      width={600}
                      height={img.aspect === 'portrait' ? 800 : img.aspect === 'square' ? 600 : 400}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-canopy-dark/0 group-hover:bg-canopy-dark/40 transition-colors duration-500 flex items-end justify-start p-4">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        {img.caption}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>

          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <Bird className="w-12 h-12 text-canopy-dark/20 mx-auto mb-4" />
              <p className="text-canopy-dark/40 text-lg">
                No photos in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <AnimatedSection>
        <section className="py-16 md:py-20 bg-morning-mist text-center">
          <div className="container-wide max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark mb-4">
              See It in Person
            </h2>
            <p className="text-canopy-dark/60 text-lg mb-8">
              Pictures capture the beauty, but nothing compares to standing on
              the rooftop as thousands of parakeets fill the sky above you.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-sanctuary-green hover:bg-canopy-dark text-white font-semibold px-8 py-3.5 rounded-full text-base transition-all duration-300"
            >
              Book Your Visit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </AnimatedSection>

      {/* Lightbox */}
      <ImageLightbox
        images={filteredImages.map((img) => ({
          src: img.src,
          alt: img.alt,
          caption: img.caption,
        }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      <Footer />
    </>
  );
}
