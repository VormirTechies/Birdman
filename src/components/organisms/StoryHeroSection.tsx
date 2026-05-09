'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, VolumeX } from 'lucide-react';

const STORY_VIDEO =
  'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/videos/Birdman_story_wide.mp4';

// ── Module-level blob-URL cache ────────────────────────────────────────────────
// Module variables survive re-renders, Strict-Mode double-mounts, and in-tab
// navigations — the video is fetched at most ONCE per tab session.
let _storyBlobUrl: string | null = null;
let _storyFetch: Promise<string> | null = null;

function loadStoryVideo(): Promise<string> {
  if (_storyBlobUrl) return Promise.resolve(_storyBlobUrl);
  if (!_storyFetch) {
    _storyFetch = fetch(STORY_VIDEO)
      .then((r) => r.blob())
      .then((blob) => {
        _storyBlobUrl = URL.createObjectURL(blob);
        _storyFetch = null;
        return _storyBlobUrl;
      })
      .catch(() => {
        _storyFetch = null;
        return STORY_VIDEO; // fallback to direct URL on error
      });
  }
  return _storyFetch;
}
// ──────────────────────────────────────────────────────────────────────────────

export function StoryHeroSection() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Start blob fetch immediately so it's ready (or close to ready)
    // when the 5 s reveal timer fires.
    const fetchPromise = loadStoryVideo();
    const timer = setTimeout(async () => {
      const src = await fetchPromise;
      setVideoSrc(src);
    }, 5_000);
    return () => clearTimeout(timer);
  }, []);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !videoRef.current.muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[90vh] min-h-100 bg-canopy-dark">

        {/* Static photo — visible for first 15 s */}
        <Image
          src="/images/gallery/sudarson-004.jpg"
          alt="Mr. Sudarson Sah with parakeets"
          fill
          priority
          className={`object-cover object-top transition-opacity duration-1000 ${
            videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
          sizes="100vw"
        />

        {/* Video — mounts after 5 s using cached blob URL */}
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            onCanPlay={() => {
              setVideoReady(true);
              if (videoRef.current) videoRef.current.muted = false;
            }}
            onEnded={() => {
              setVideoSrc(null);
              setVideoReady(false);
            }}
          />
        )}

        {/* Mute toggle — appears once video is playing */}
        <AnimatePresence>
          {videoSrc !== null && videoReady && (
            <motion.button
              key="mute"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={toggleMute}
              aria-label={muted ? 'Unmute video' : 'Mute video'}
              className="absolute top-24 right-5 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-colors duration-200"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-canopy-dark/70 via-canopy-dark/40 to-feather-cream" />

        {/* Hero text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-3xl px-4"
          >
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <Heart className="w-4 h-4 fill-current" />
              A Story of Love &amp; Dedication
            </span>
            <h1 className="font-display font-black text-white text-4xl md:text-5xl lg:text-6xl leading-tight drop-shadow-xl">
              The Man Behind{' '}
              <span className="text-golden-hour">the Miracle</span>
            </h1>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
