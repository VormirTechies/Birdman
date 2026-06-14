'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const volunteerCards = [
  {
    name: 'Gopal',
    role: 'Visitor Coordinationt',
    image: '/images/volunteer-placeholder.svg',
    // description: 'Guides the daily feeding routine and helps manage the parakeet platforms.',
  },
  {
    name: 'Saritha Devi',
    role: 'Visitor Coordination',
    image: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/volunteer/Saritha.jpeg',
    // description: 'Welcomes guests and shares the sanctuary story with every visitor.',
  },
  {
    name: 'Gowtham',
      role: 'Visitor Coordination',
    image: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/volunteer/Gowtham.jpeg',
    // description: 'Supports general sanctuary upkeep and behind-the-scenes care.',
  },
  {
    name: 'Sai Rahul',
      role: 'Visitor Coordination',
    image: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/volunteer/Sai%20Rahul.jpeg',
    // description: 'Connects the local community and helps grow volunteer support.',
  },
  {
    name: 'Manikandan',
      role: 'Visitor Coordination',
    image: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/volunteer/Manikandan.jpeg',
    // description: 'Connects the local community and helps grow volunteer support.',
  },
  {
    name: 'Rahul',
      role: 'Visitor Coordination',
    image: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/volunteer/Rahul.jpeg',
    // description: 'Connects the local community and helps grow volunteer support.',
    },
    {
        name: 'Mahesh',
        role: 'Visitor Coordination',
        image: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/volunteer/Mahesh.jpeg',
        // description: 'Connects the local community and helps grow volunteer support.',
    },
];

export default function VolunteerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % volunteerCards.length);
    }, 60000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getVisibleCards = () => {
    return [
      volunteerCards[activeIndex],
      volunteerCards[(activeIndex + 1) % volunteerCards.length],
      volunteerCards[(activeIndex + 2) % volunteerCards.length],
    ];
  };

  const handlePrevious = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + volunteerCards.length) % volunteerCards.length);
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % volunteerCards.length);
  };

  const visibleCards = getVisibleCards();

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-card">
      {/* Left Arrow */}
      <button
        onClick={handlePrevious}
        className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-canopy-dark shadow-md transition hover:bg-white focus:outline-none"
        aria-label="Previous volunteers"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={handleNext}
        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-canopy-dark shadow-md transition hover:bg-white focus:outline-none"
        aria-label="Next volunteers"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ x: direction * 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="px-6 md:px-12 py-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleCards.map((volunteer, idx) => (
              <div key={idx} className="rounded-[1.75rem] bg-feather-cream shadow-card overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
                  <Image
                    src={volunteer.image}
                    alt={volunteer.name}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 568px), 300px"
                    priority={idx === 0}
                  />
                </div>
                
                {/* Content */}
                <div className="p-5 text-center">
                  <h4 className="font-display font-bold text-canopy-dark text-lg mb-1">
                    {volunteer.name}
                  </h4>
                  <p className="text-sanctuary-green text-sm font-semibold">
                    {volunteer.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicator Dots */}
      <div className="flex items-center justify-center gap-2 pb-6">
        {volunteerCards.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              setActiveIndex(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex
                ? 'w-8 bg-sanctuary-green'
                : 'w-2 bg-sanctuary-green/30 hover:bg-sanctuary-green/50'
            }`}
            aria-label={`Go to volunteer ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
