import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';

interface BookingConfirmationProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
  bookingId: string;
}

export default function BookingConfirmation({
  visitorName,
  bookingDate,
  bookingTime,
  numberOfGuests,
  bookingId,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>🦜 Booking Confirmed!</Heading>
          
          <Text style={styles.greeting}>Dear {visitorName},</Text>
          
          <Text style={styles.text}>
            Your booking to visit the Birdman of Chennai has been confirmed! 
            We're excited to welcome you and your guests to witness the amazing spectacle 
            of over 6,000 parakeets.
          </Text>

          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Booking Details</Text>
            
            <Text style={styles.detail}>
              <strong>Date:</strong> {formatDate(bookingDate)}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Time:</strong> {bookingTime}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Number of Guests:</strong> {numberOfGuests}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Booking ID:</strong> {bookingId}
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Section>
            <Text style={styles.sectionHeading}>📍 Location</Text>
            <Text style={styles.text}>
              <strong>Birdman of Chennai</strong><br />
              2, Iyya Mudali St, Adikesavarpuram,<br />
              Chintadripet, Chennai, Tamil Nadu 600002
            </Text>
            <Text style={styles.text}>
              <a href="https://maps.app.goo.gl/G76qA7qZAJ3g44Pu9" style={styles.link}>
                🦅 View on Google Maps
              </a>
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionHeading}>⏰ What to Expect</Text>
            <Text style={styles.text}>
              • Arrive 10 minutes before your scheduled time<br />
              • The feeding session lasts approximately 30 minutes<br />
              • Please maintain silence to avoid startling the birds<br />
              • Photography is allowed and encouraged!
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionHeading}>📋 Important Reminders</Text>
            <Text style={styles.text}>
              • Wear comfortable clothing<br />
              • Avoid bright colors that may startle the birds<br />
              • Keep a respectful distance from Mr. Sudarson Sah during feeding<br />
              • No pets allowed
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            You will receive a reminder on the morning of your visit. If you need to 
            reschedule, please contact us at least 24 hours in advance.
          </Text>

          <Text style={styles.signature}>
            Warm regards,<br />
            <strong>The Birdman of Chennai Team</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
    borderRadius: '8px',
  },
  heading: {
    color: '#16a34a',
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '0 0 30px',
  },
  greeting: {
    fontSize: '18px',
    color: '#1f2937',
    margin: '0 0 16px',
  },
  text: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '24px',
    margin: '0 0 16px',
  },
  detailsBox: {
    backgroundColor: '#f0fdf4',
    border: '2px solid #16a34a',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
  },
  detailsHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#15803d',
    margin: '0 0 16px',
  },
  detail: {
    fontSize: '16px',
    color: '#1f2937',
    margin: '8px 0',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '24px 0 12px',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '32px 0',
  },
  footer: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '20px',
    margin: '24px 0 16px',
  },
  signature: {
    fontSize: '16px',
    color: '#1f2937',
    margin: '16px 0 0',
  },
  link: {
    color: '#16a34a',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
};
