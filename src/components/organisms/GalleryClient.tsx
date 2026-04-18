'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Eye, ImageIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type GalleryCategory = 'all' | 'parakeets' | 'birdman' | 'sanctuary';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  category: GalleryCategory[];
  aspect: 'square' | 'landscape' | 'portrait';
}

const categories: { value: GalleryCategory; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'parakeets', label: 'Parakeets' },
  { value: 'birdman', label: 'The Birdman' },
  { value: 'sanctuary', label: 'Sanctuary' },
];

export function GalleryClient({ initialImages }: { initialImages: GalleryImage[] }) {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const filteredImages =
    activeCategory === 'all'
      ? initialImages
      : initialImages.filter((img) => img.category.includes(activeCategory));

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <main className="min-h-screen bg-feather-cream">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-12 bg-canopy-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sanctuary-green/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="container-wide text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full mb-6 backdrop-blur-md border border-white/5">
              <Camera className="w-3.5 h-3.5" />
              {initialImages.length} Visual Testimonials
            </span>
            <h1 className="font-display font-black text-white text-5xl md:text-7xl lg:text-8xl mb-6 tracking-tight leading-[0.9]">
              The Sanctuary{' '}
              <span className="text-golden-hour bg-clip-text text-transparent bg-gradient-to-r from-sunset-amber to-golden-hour">in Pictures</span>
            </h1>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Witness the emerald sky of Chintadripet. Every frame captures the 
              unwavering bond between a man and 14,000 free-flying friends.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FILTERS ──────────────────────────────────────────────────────── */}
      <section className="bg-white/80 backdrop-blur-xl sticky top-16 md:top-20 z-50 border-b border-canopy-dark/5 shadow-sm">
        <div className="container-wide py-5">
          <Tabs
            value={activeCategory}
            onValueChange={(v) => setActiveCategory(v as GalleryCategory)}
          >
            <TabsList className="bg-canopy-dark/5 p-1 rounded-full h-12 w-full md:w-auto">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="rounded-full px-6 py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-canopy-dark data-[state=active]:shadow-xl transition-all"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* ── GALLERY GRID ─────────────────────────────────────────────────── */}
      <section className="py-12 md:py-24">
        <div className="container-wide">
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 lg:gap-8 [column-fill:_balance]"
            >
              {filteredImages.map((img, i) => (
                <motion.div
                  key={img.src}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.05,
                    ease: [0.23, 1, 0.32, 1] 
                  }}
                  className="break-inside-avoid mb-4 md:mb-6 lg:mb-8"
                >
                  <button
                    onClick={() => openLightbox(i)}
                    className="block w-full group relative overflow-hidden rounded-[2rem] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_80px_rgba(0,0,0,0.08)] transition-all duration-700 hover:-translate-y-2 border border-canopy-dark/5"
                  >
                    <div className="relative">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={800}
                        height={img.aspect === 'portrait' ? 1200 : img.aspect === 'landscape' ? 600 : 800}
                        className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      
                      {/* 💎 Glassmorphism Archive Overlay */}
                      <div className="absolute inset-x-4 bottom-4 p-6 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 shadow-2xl">
                         <div className="flex flex-col gap-3">
                            {img.caption && (
                              <p className="text-white font-bold text-sm leading-snug drop-shadow-md">
                                {img.caption}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-sanctuary-green rounded-lg flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-500">
                                     <Eye className="w-4 h-4" />
                                  </div>
                                  <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] pt-0.5">Explore</span>
                               </div>
                               <div className="flex gap-1">
                                  {img.category.filter(c => c !== 'all').map(c => (
                                    <span key={c} className="px-2 py-0.5 bg-white/20 rounded-md text-[8px] text-white font-bold uppercase">
                                      {c}
                                    </span>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      {/* Subtle Dark Gradient for better legibility when overlay is active */}
                      <div className="absolute inset-0 bg-gradient-to-t from-canopy-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredImages.length === 0 && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-40 bg-white rounded-[4rem] border border-dashed border-canopy-dark/10"
            >
              <div className="w-24 h-24 bg-canopy-dark/[0.03] rounded-full flex items-center justify-center mx-auto mb-8">
                 <ImageIcon className="w-10 h-10 text-canopy-dark/10" />
              </div>
              <h3 className="font-display font-bold text-2xl text-canopy-dark mb-2">No Exhibits Found</h3>
              <p className="text-canopy-dark/40 max-w-sm mx-auto">
                No photos in this category yet. Check back soon for more arrivals.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <AnimatedSection>
        <section className="pb-24 pt-12 text-center">
          <div className="container-wide">
            <div className="bg-canopy-dark rounded-[4rem] p-12 md:p-24 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(62,176,140,0.1),transparent_70%)] pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                  Be Part of the <span className="text-sanctuary-green">Emerald Arrival</span>
                </h2>
                <p className="text-white/50 text-xl mb-12 leading-relaxed">
                  The lens captures the beauty, but the soul feels the wonder. Stand on the rooftop 
                  at dawn as the sky turns green.
                </p>
                <Link
                  href="/book"
                  className="group inline-flex items-center gap-4 bg-white hover:bg-sanctuary-green text-canopy-dark hover:text-white font-black px-12 py-5 rounded-full text-lg transition-all duration-500 shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95"
                >
                  Schedule Your Flight
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
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
    </main>
  );
}
