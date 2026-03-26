'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/banner_hd.png"
          alt="Parakeets flying over Chennai rooftop"
          fill
          priority
          className="object-cover w-full h-full"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-deep-night/60 via-transparent to-parchment/80 z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center max-w-4xl">
        <motion.div {...fadeInUp}>
          <h1 className="mb-6">
            <span className="block text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight drop-shadow-lg">
              Birdman of Chennai
            </span>
            <span className="block text-white/90 font-tamil font-medium text-2xl md:text-3xl mt-2 drop-shadow-lg">
              சென்னை பறவை மனிதர்
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="text-center max-w-2xl mx-auto text-white text-lg md:text-xl leading-relaxed mb-10 drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Where 14,000 wild parakeets come home daily to feed
        </motion.p>

        <motion.div
          className="flex flex-col md:flex-row justify-center gap-3 md:gap-4 w-full max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button
            asChild
            size="sm"
            className="gap-2 h-11 md:h-12 min-w-[140px] md:min-w-[160px] max-w-[240px] px-6 md:px-8 text-base md:text-lg rounded-lg"
          >
            <Link href="/book">
              <Calendar className="w-5 h-5" />
              Book Your Visit
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-2 h-10 md:h-11 min-w-[120px] md:min-w-[140px] max-w-[200px] px-5 md:px-7 text-base md:text-lg rounded-lg"
          >
            <Link href="#about">
              <Play className="w-5 h-5" />
              Watch His Story
            </Link>
          </Button>
        </motion.div>

      </div>

      {/* Scroll Indicator - bottom center */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-6 md:bottom-8 z-30"
        aria-label="Scroll for more | மேலும் காண ஸ்க்ரோல் செய்யவும்"
      >
        <ChevronDown className="w-8 h-8 text-white/70 drop-shadow-lg" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
