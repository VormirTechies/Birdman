'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  rotation: number;
}

interface FloatingParticlesProps {
  count?: number;
  color?: string;
}

export function FloatingParticles({
  count = 12,
  color = 'rgba(52, 211, 153, 0.3)',
}: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setParticles(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 8,
          duration: 10 + Math.random() * 15,
          size: 16 + Math.random() * 24,
          opacity: 0.35 + Math.random() * 0.45,
          rotation: Math.random() * 360,
        }))
      );
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [count]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: '-5%' }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, Math.sin(p.id) * 80, Math.cos(p.id) * 40, 0],
            rotate: [p.rotation, p.rotation + 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Feather-like SVG */}
          <svg
            width={p.size}
            height={p.size * 2.5}
            viewBox="0 0 20 50"
            fill="none"
            style={{ opacity: p.opacity }}
          >
            <path
              d="M10 0 C10 0, 0 15, 2 30 C3 38, 8 45, 10 50 C12 45, 17 38, 18 30 C20 15, 10 0, 10 0Z"
              fill={color}
            />
            <line
              x1="10" y1="5" x2="10" y2="48"
              stroke={color}
              strokeWidth="0.5"
              opacity="0.5"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
