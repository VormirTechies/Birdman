'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FeedbackCard } from '@/components/molecules/FeedbackCard';
import { Button } from '@/components/ui/button';
import type { Feedback } from '@/types';

interface FeedbackSectionProps {
  feedback?: Feedback[];
  loading?: boolean;
}

// Mock feedback for now
const mockFeedback: Feedback[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    rating: 5,
    message: 'An absolutely breathtaking experience! Seeing thousands of parakeets gather at once is truly magical. Mr. Sudarson\'s dedication and love for these birds is inspiring. A must-visit for anyone in Chennai!',
    createdAt: '2026-03-20T10:30:00Z',
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    rating: 5,
    message: 'This is not just bird watching, it\'s witnessing a miracle of nature. The way the birds trust Mr. Sudarson is beautiful to see. My kids were amazed!',
    createdAt: '2026-03-18T15:45:00Z',
  },
  {
    id: '3',
    name: 'Anonymous',
    rating: 5,
    message: 'A unique sanctuary in the heart of Chennai. The feeding sessions are well-organized and respectful to the birds. Highly recommend!',
    createdAt: '2026-03-15T09:20:00Z',
  },
  {
    id: '4',
    name: 'Lakshmi Venkat',
    rating: 5,
    message: 'We came all the way from Bangalore to see this and it exceeded all expectations. The sound of thousands of birds is something you have to experience.',
    createdAt: '2026-03-12T14:10:00Z',
  },
  {
    id: '5',
    name: 'Mohammed Ali',
    rating: 5,
    message: 'A wonderful conservation effort by Mr. Sudarson. Seeing this many wild birds in harmony is a testament to his patience and care.',
    createdAt: '2026-03-10T11:00:00Z',
  },
];

export function FeedbackSection({ feedback = mockFeedback, loading = false }: FeedbackSectionProps) {
  return (
    <section id="feedback" className="py-16 md:py-24 bg-parchment">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-deep-night mb-4">
            Visitor Testimonials
          </h2>
          <p className="text-deep-night/70 text-lg max-w-2xl mx-auto">
            Hear from those who have experienced the magic
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {feedback.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <FeedbackCard
                name={item.name}
                rating={item.rating}
                message={item.message}
                date={item.createdAt}
                truncateLength={150}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/feedback">View All Feedback</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
