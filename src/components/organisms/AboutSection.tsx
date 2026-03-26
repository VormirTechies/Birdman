'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bird, Clock, Users, Calendar } from 'lucide-react';

export function AboutSection() {
  const stats = [
    { icon: Calendar, label: '16+ Years', description: 'Of dedication' },
    { icon: Bird, label: '14,000 Birds', description: 'Daily visitors' },
    { icon: Clock, label: '2 Sessions', description: 'Morning & evening' },
    { icon: Users, label: '1000s', description: 'Happy visitors' },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-parchment">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image Block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg"
          >
            {/* Placeholder image - replace with actual photo */}
            <div className="w-full h-full bg-linear-to-br from-parakeet-green to-chennai-earth flex items-center justify-center">
              <Bird className="w-32 h-32 text-white/20" />
            </div>
          </motion.div>

          {/* Content Block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Badge variant="default" className="mb-2">
              Our Story
            </Badge>

            <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night">
              A 16-Year Bond with Nature
            </h2>

            <div className="space-y-4 text-deep-night/80 leading-relaxed">
              <p>
                For over 16 years, Mr. Sudarson Sah has welcomed thousands of wild parakeets
                to his rooftop sanctuary in Chintadripet, Chennai. What started as a simple
                act of feeding a few birds has grown into an extraordinary daily gathering
                of up to 14,000 parakeets.
              </p>
              <p>
                Every morning and evening, the sky fills with green wings as these beautiful
                birds return to the place they trust—a testament to patience, dedication,
                and an unwavering love for nature.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-mist-white p-4 rounded-xl text-center"
                >
                  <stat.icon className="w-6 h-6 text-parakeet-green mx-auto mb-2" />
                  <div className="font-bold text-lg text-deep-night">{stat.label}</div>
                  <div className="text-sm text-chennai-earth">{stat.description}</div>
                </motion.div>
              ))}
            </div>

            <Button asChild size="lg" className="mt-6">
              <Link href="/book">Book Your Visit</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
