'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, VolumeX } from 'lucide-react';

const STORY_VIDEO =
  'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/videos/Birdman_story_wide.mp4';

export function StoryHeroSection() {
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowVideo(true), 15_000);
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
            showVideo ? 'opacity-0' : 'opacity-100'
          }`}
          sizes="100vw"
        />

        {/* Video — mounts after 15 s, fades in once ready */}
        {showVideo && (
          <video
            ref={videoRef}
            src={STORY_VIDEO}
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
              setShowVideo(false);
              setVideoReady(false);
            }}
          />
        )}

        {/* Mute toggle — appears once video is playing */}
        <AnimatePresence>
          {showVideo && videoReady && (
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
