// TypeScript types for Birdman of Chennai application

export interface Feedback {
  id: string;
  bookingId?: string;
  name?: string;
  rating: number;
  message: string;
  visitDate?: string;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Booking {
  id: string;
  sessionId: string;
  visitorName: string;
  phone: string;
  email?: string;
  // New guest count fields
  adults: number;
  children: number;
  // DEPRECATED: Use adults + children instead
  numberOfGuests?: number;
  numberOfVisitors?: number; // Legacy alias for numberOfGuests
  locale: 'en' | 'ta';
  rulesAccepted: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  isAvailable: boolean;
}

export interface BookingFormData {
  visitorName: string;
  phone: string;
  email: string;
  // New guest count fields
  adults: number;
  children: number;
  // DEPRECATED: Use adults + children instead
  numberOfGuests?: number;
  numberOfVisitors?: number; // Legacy alias for numberOfGuests
  date: string;
  time: string;
  rulesAccepted: boolean;
}

export interface FeedbackFormData {
  name: string;
  rating: number;
  message: string;
  visitDate: string;
}
