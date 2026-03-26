'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { FeedbackCard } from '@/components/molecules/FeedbackCard';
import { Loading } from '@/components/atoms/Loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MessageSquarePlus, Star } from 'lucide-react';
import type { Feedback } from '@/types';

// Mock feedback data
const mockFeedback: Feedback[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    rating: 5,
    message: 'An absolutely breathtaking experience! Seeing thousands of parakeets gather at once is truly magical. Mr. Sudarson\'s dedication and love for these birds is inspiring. A must-visit for anyone in Chennai! The way the birds trust him is beautiful.',
    visitDate: '2026-03-18',
    createdAt: '2026-03-20T10:30:00Z',
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    rating: 5,
    message: 'This is not just bird watching, it\'s witnessing a miracle of nature. The way the birds trust Mr. Sudarson is beautiful to see. My kids were amazed and it was a wonderful educational experience for them.',
    visitDate: '2026-03-16',
    createdAt: '2026-03-18T15:45:00Z',
  },
  {
    id: '3',
    name: 'Anonymous',
    rating: 5,
    message: 'A unique sanctuary in the heart of Chennai. The feeding sessions are well-organized and respectful to the birds. Highly recommend visiting during the evening session for the best light.',
    visitDate: '2026-03-14',
    createdAt: '2026-03-15T09:20:00Z',
  },
  {
    id: '4',
    name: 'Lakshmi Venkat',
    rating: 5,
    message: 'We came all the way from Bangalore to see this and it exceeded all expectations. The sound of thousands of birds is something you have to experience. Worth every kilometer of the drive!',
    visitDate: '2026-03-10',
    createdAt: '2026-03-12T14:10:00Z',
  },
  {
    id: '5',
    name: 'Mohammed Ali',
    rating: 5,
    message: 'A wonderful conservation effort by Mr. Sudarson. Seeing this many wild birds in harmony is a testament to his patience and care over the years.',
    visitDate: '2026-03-08',
    createdAt: '2026-03-10T11:00:00Z',
  },
  {
    id: '6',
    name: 'Anita Desai',
    rating: 4,
    message: 'Fantastic experience! The only suggestion would be to have more shade for visitors during summer months. Otherwise, absolutely wonderful.',
    visitDate: '2026-03-06',
    createdAt: '2026-03-08T16:20:00Z',
  },
  {
    id: '7',
    name: 'Kumar Swamy',
    rating: 5,
    message: 'As a photographer, this was a dream come true. The birds are so comfortable and the lighting during evening feed is perfect. Thank you Mr. Sudarson!',
    visitDate: '2026-03-04',
    createdAt: '2026-03-06T12:45:00Z',
  },
  {
    id: '8',
    name: 'Deepa Krishnan',
    rating: 5,
    message: 'An unforgettable experience for our entire family. The kids learned so much about bird conservation and had a great time. Will definitely visit again!',
    visitDate: '2026-03-02',
    createdAt: '2026-03-04T09:30:00Z',
  },
];

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    // Mock API call
    const fetchFeedback = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFeedback(mockFeedback);
      setLoading(false);
    };

    fetchFeedback();
  }, []);

  const filteredFeedback = filter
    ? feedback.filter((item) => item.rating === filter)
    : feedback;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedback.filter((item) => item.rating === rating).length,
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-parchment py-24 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-deep-night mb-4">
              Visitor Testimonials
            </h1>
            <p className="text-deep-night/70 text-lg mb-8">
              Read what visitors say about their experience
            </p>
            <Button asChild size="lg">
              <Link href="/feedback/submit">
                <MessageSquarePlus className="w-5 h-5 mr-2" />
                Share Your Experience
              </Link>
            </Button>
          </div>

          {/* Filter by Rating */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <span className="text-sm font-medium text-deep-night">Filter by rating:</span>
              <Button
                variant={filter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(null)}
              >
                All
              </Button>
              {ratingCounts.map(({ rating, count }) => (
                <Button
                  key={rating}
                  variant={filter === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(rating)}
                  className="gap-2"
                >
                  <Star className="w-4 h-4 fill-current" />
                  {rating} ({count})
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loading size="lg" />
            </div>
          )}

          {/* Feedback Grid */}
          {!loading && (
            <>
              {filteredFeedback.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFeedback.map((item) => (
                    <FeedbackCard
                      key={item.id}
                      name={item.name}
                      rating={item.rating}
                      message={item.message}
                      date={item.createdAt}
                      truncateLength={200}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-deep-night/60">
                    No feedback found for this rating.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
