'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bird, Calendar, ChevronDown, ArrowRight } from 'lucide-react';
import { FloatingParticles } from '@/components/ui/floating-particles';

export function HomepageHero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/banner_hd.png"
          alt="Parakeet soaring over Chennai rooftop at golden hour"
          fill
          priority
          className="hidden sm:block object-cover"
          sizes="100vw"
        />
        <Image
          src="/images/mobile_banner.png"
          alt="Parakeet soaring over Chennai rooftop at golden hour"
          fill
          priority
          className="block sm:hidden object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>

      {/* Floating feathers */}
      <FloatingParticles count={10} />

      {/* Content */}
      <div className="relative z-10 container-wide text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Bird className="w-4 h-4" />
            Chennai&apos;s Urban Bird Sanctuary
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display font-black text-white text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight drop-shadow-xl mb-4"
        >
          The Birdman
          <br />
          <span className="text-golden-hour">of Chennai</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="font-tamil text-white/80 text-xl md:text-2xl mb-2 drop-shadow-lg"
        >
          சென்னையின் பறவை மனிதர்
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          Where ~6,000 wild parakeets come home every day
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-golden-hour hover:bg-sunset-amber text-canopy-dark font-semibold px-8 py-3.5 rounded-full transition-all duration-300 hover:shadow-glow-gold text-base"
          >
            <Calendar className="w-5 h-5" />
            Book Your Visit
          </Link>
          <Link
            href="/story"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium px-7 py-3.5 rounded-full transition-all duration-300 text-base border border-white/20"
          >
            Read His Story
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="w-7 h-7 text-white/50" />
      </motion.div>
    </section>
  );
}
