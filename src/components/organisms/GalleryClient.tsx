'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection } from '@/components/ui/animated-section';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GalleryImage {
  id: string;
  src: string;
  title: string;
  description?: string;
  aspect: 'square' | 'landscape' | 'portrait';
}

interface GalleryClientProps {
  initialImages: GalleryImage[];
  totalCount: number;
}

// ─── Bento span helper ──────────────────────────────────────────────────────────
// Organic repeating pattern; grid-auto-flow:dense fills gaps naturally.

function getBentoClass(i: number): string {
  const p = i % 10;
  if (p === 0) return 'col-span-2 row-span-2';
  if (p === 2) return 'col-span-1 row-span-2';
  if (p === 5) return 'col-span-2 row-span-1';
  if (p === 7) return 'col-span-1 row-span-2';
  if (p === 9) return 'col-span-2 row-span-1';
  return 'col-span-1 row-span-1';
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className={`${getBentoClass(index)} rounded-2xl md:rounded-3xl bg-canopy-dark/8 animate-pulse`}
    />
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const VIDEO_URL =
  'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/videos/Meiyazhagan.mp4';

export function GalleryClient({ initialImages, totalCount }: GalleryClientProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialImages.length < totalCount);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({
    open: false,
    index: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialImages.length);

  // ── Mute toggle ──────────────────────────────────────────────────────────────

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
  };

  // ── Infinite scroll ───────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gallery?offset=${offsetRef.current}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const fetched: GalleryImage[] = (data.images ?? []).map(
        (img: {
          id: string;
          url: string;
          altText?: string;
          caption?: string;
          aspect?: string;
        }) => ({
          id: img.id,
          src: img.url,
          title: img.altText || img.caption || 'Parakeet at Birdman Sanctuary',
          description: img.caption ?? undefined,
          aspect: (img.aspect as GalleryImage['aspect']) || 'square',
        }),
      );
      if (fetched.length === 0) {
        setHasMore(false);
      } else {
        setImages((prev) => [...prev, ...fetched]);
        offsetRef.current += fetched.length;
        if (fetched.length < PAGE_SIZE) setHasMore(false);
      }
    } catch {
      // silently fail — sentinel will retry on next intersection
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Lightbox keyboard navigation ──────────────────────────────────────────────

  useEffect(() => {
    if (!lightbox.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight')
        setLightbox((l) => ({ ...l, index: (l.index + 1) % images.length }));
      else if (e.key === 'ArrowLeft')
        setLightbox((l) => ({ ...l, index: (l.index - 1 + images.length) % images.length }));
      else if (e.key === 'Escape') setLightbox((l) => ({ ...l, open: false }));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox.open, images.length]);

  const currentImage = images[lightbox.index];

  return (
    <main className="min-h-screen bg-feather-cream">
      {/* ── VIDEO HERO ────────────────────────────────────────────────────── */}
      <section className="relative h-[60vh] md:h-[78vh] overflow-hidden bg-canopy-dark">
        {/* Fallback gradient visible while video loads */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(62,176,140,0.08),transparent_70%)]" />

        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
          onCanPlay={() => setVideoReady(true)}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-canopy-dark/85 via-canopy-dark/20 to-transparent" />

        {/* Mute toggle — top right below header */}
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="absolute top-24 right-5 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all duration-200"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Hero copy — bottom left */}
        <div className="absolute inset-0 flex items-end">
          <div className="container-wide pb-12 md:pb-20 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full mb-5 backdrop-blur-md border border-white/5">
                <Camera className="w-3.5 h-3.5" />
                {totalCount} Moments Captured
              </span>
              <h1 className="font-display font-black text-white text-4xl md:text-6xl lg:text-7xl leading-[0.9] tracking-tight">
                One Man. One Rooftop.{' '}
                <span className="text-golden-hour">14,000 Wings.</span>
              </h1>
              <p className="text-white/50 text-base md:text-lg max-w-xl mt-4 leading-relaxed">
                Every sunrise above Chintadripet, Sudarson Sah steps onto his rooftop — and
                thousands of parakeets descend from the Chennai sky to greet him. These are the
                moments visitors never forget.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ───────────────────────────────────────────────────── */}
      <section className="py-10 md:py-16">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-3 md:gap-4 grid-flow-dense">
            {images.map((img, i) => (
              <motion.button
                key={img.id}
                className={`${getBentoClass(i)} relative overflow-hidden rounded-2xl md:rounded-3xl group bg-canopy-dark/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sanctuary-green`}
                onClick={() => setLightbox({ open: true, index: i })}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (i % 8) * 0.04 }}
              >
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-canopy-dark/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Caption on hover */}
                {img.title && (
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 pointer-events-none">
                    <p className="text-white font-semibold text-xs md:text-sm leading-snug line-clamp-2 drop-shadow-md">
                      {img.title}
                    </p>
                  </div>
                )}
              </motion.button>
            ))}

            {/* Skeleton placeholders while loading next page */}
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={`skel-${i}`} index={images.length + i} />
              ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} className="h-12 mt-2" />}

          {/* End-of-gallery message */}
          {!hasMore && images.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-canopy-dark/30 text-sm mt-10 font-medium tracking-wide"
            >
              You&apos;ve seen all {images.length} moments
            </motion.p>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <AnimatedSection>
        <section className="pb-24 pt-12 text-center">
          <div className="container-wide">
            <div className="bg-canopy-dark rounded-[4rem] p-12 md:p-24 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(62,176,140,0.1),transparent_70%)] pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                  Be Part of the{' '}
                  <span className="text-sanctuary-green">Emerald Arrival</span>
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
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox.open && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox((l) => ({ ...l, open: false }))}
          >
            {/* Close */}
            <button
              aria-label="Close lightbox"
              className="absolute top-5 right-5 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={() => setLightbox((l) => ({ ...l, open: false }))}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((l) => ({
                  ...l,
                  index: (l.index - 1 + images.length) % images.length,
                }));
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next */}
            <button
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((l) => ({
                  ...l,
                  index: (l.index + 1) % images.length,
                }));
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image + metadata */}
            <motion.div
              key={lightbox.index}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-5xl w-full mx-16 md:mx-24 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={currentImage.src}
                alt={currentImage.title || 'Parakeet at Birdman Sanctuary'}
                width={1200}
                height={800}
                className="w-auto h-auto max-w-full max-h-[70vh] mx-auto rounded-2xl object-contain"
                priority
              />

              {(currentImage.title || currentImage.description) && (
                <div className="mt-5 text-center px-4">
                  {currentImage.title && (
                    <p className="text-white font-semibold text-base md:text-lg">
                      {currentImage.title}
                    </p>
                  )}
                  {currentImage.description &&
                    currentImage.description !== currentImage.title && (
                      <p className="text-white/55 text-sm mt-1 max-w-xl mx-auto">
                        {currentImage.description}
                      </p>
                    )}
                </div>
              )}

              <p className="text-white/25 text-xs mt-3 tracking-widest">
                {lightbox.index + 1} / {images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
