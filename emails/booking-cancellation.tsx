/**
 * Booking Cancellation Email Template
 * Sent to visitors when admin blocks dates via settings page
 */

import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
  Button,
} from '@react-email/components';

interface BookingCancellationProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  numberOfGuests?: number; // Deprecated
  bookingId: string;
}

// Helper function to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BookingCancellation({
  visitorName,
  bookingDate,
  bookingTime,
  adults,
  children,
  numberOfGuests,
  bookingId,
}: BookingCancellationProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>🦜 Booking Cancellation Notice</Heading>
          
          <Text style={styles.greeting}>Dear {visitorName},</Text>
          
          <Text style={styles.text}>
            We sincerely apologize, but we need to inform you that your booking to visit 
            the Birdman of Chennai has been cancelled due to unforeseen circumstances on the scheduled date.
          </Text>

          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Cancelled Booking Details</Text>
            
            <Text style={styles.detail}>
              <strong>Date:</strong> {formatDate(bookingDate)}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Time:</strong> {bookingTime}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Number of Guests:</strong> {children > 0 ? `${adults} Adult${adults !== 1 ? 's' : ''} + ${children} Child${children !== 1 ? 'ren' : ''}` : `${adults} Adult${adults !== 1 ? 's' : ''}`}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Booking ID:</strong> {bookingId}
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Section>
            <Text style={styles.sectionHeading}>🔄 Rebook Your Visit</Text>
            <Text style={styles.text}>
              We would love to have you visit us on another date! Please use the link below 
              to select a new date that works for you and your guests.
            </Text>

            <Button
              href={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://birdmanofchennai.com'}/booking`}
              style={styles.button}
            >
              Rebook Another Date
            </Button>
          </Section>

          <Hr style={styles.hr} />

          <Section>
            <Text style={styles.sectionHeading}>📍 Location</Text>
            <Text style={styles.text}>
              <strong>Birdman of Chennai</strong><br />
              2/3, Iyya Mudali St, Adikesavarpuram,<br />
              Chintadripet, Chennai, Tamil Nadu 600002
            </Text>
            <Text style={styles.text}>
              <a href="https://maps.app.goo.gl/yTxPBBwY1X3A3bda6" style={styles.link}>
                🗺️ View on Google Maps
              </a>
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionHeading}>💬 Need Help?</Text>
            <Text style={styles.text}>
              If you have any questions or concerns, please don't hesitate to reach out to us. 
              We're here to help make your visit memorable!
            </Text>
            <Text style={styles.text}>
              <strong>Contact:</strong> Sudarson Sah<br />
              <strong>Phone:</strong> +91 98765 43210<br />
              <strong>Email:</strong> <a href="mailto:birdman@chennai.com" style={styles.link}>birdman@chennai.com</a>
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            We deeply apologize for any inconvenience caused and hope to see you soon with 
            the 6,000+ parakeets at the Birdman of Chennai! 🦜
          </Text>

          <Text style={styles.subfooter}>
            This is an automated message regarding your booking cancellation. 
            Please do not reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Inline styles (similar to booking-confirmation)
const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '40px',
    borderRadius: '8px',
    maxWidth: '600px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    color: '#dc2626', // Red color for cancellation
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '0 0 24px 0',
  },
  greeting: {
    fontSize: '16px',
    margin: '0 0 16px 0',
    color: '#1f2937',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    margin: '0 0 16px 0',
  },
  detailsBox: {
    backgroundColor: '#fef2f2', // Light red background
    borderLeft: '4px solid #dc2626',
    padding: '20px',
    margin: '24px 0',
    borderRadius: '4px',
  },
  detailsHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#dc2626',
    margin: '0 0 16px 0',
  },
  detail: {
    fontSize: '15px',
    margin: '8px 0',
    color: '#1f2937',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '24px 0',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#059669', // Green for action items
    margin: '0 0 12px 0',
  },
  button: {
    backgroundColor: '#059669',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 28px',
    borderRadius: '6px',
    margin: '16px 0',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
  footer: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
    margin: '24px 0 8px 0',
    fontStyle: 'italic',
  },
  subfooter: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    margin: '8px 0 0 0',
  },
};
