import type { Metadata } from 'next';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { BookingStatusClient } from './BookingStatusClient';

export const metadata: Metadata = {
  title: 'Booking Status',
  description: 'Find, update, or cancel your Birdman of Chennai visit booking.',
  alternates: { canonical: '/booking-status' },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function BookingStatusPage() {
  return (
    <>
      <Header />
      <BookingStatusClient />
      <Footer />
    </>
  );
}
