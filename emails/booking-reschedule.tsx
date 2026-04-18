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

interface BookingRescheduleProps {
  visitorName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  numberOfGuests: number;
  bookingId: string;
}

export default function BookingReschedule({
  visitorName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  numberOfGuests,
  bookingId,
}: BookingRescheduleProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>📅 Booking Rescheduled</Heading>
          
          <Text style={styles.greeting}>Dear {visitorName},</Text>
          
          <Text style={styles.text}>
            Your booking has been successfully rescheduled. Here are your updated details:
          </Text>

          <Section style={styles.oldDetailsBox}>
            <Text style={styles.oldDetailsHeading}>Previous Booking</Text>
            <Text style={styles.detail}>
              <strong>Date:</strong> {formatDate(oldDate)}
            </Text>
            <Text style={styles.detail}>
              <strong>Time:</strong> {oldTime}
            </Text>
          </Section>

          <Text style={styles.arrowText}>↓</Text>

          <Section style={styles.newDetailsBox}>
            <Text style={styles.newDetailsHeading}>New Booking</Text>
            <Text style={styles.detail}>
              <strong>Date:</strong> {formatDate(newDate)}
            </Text>
            <Text style={styles.detail}>
              <strong>Time:</strong> {newTime}
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
                🦅 Update Navigation
              </a>
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionHeading}>📋 Important Reminders</Text>
            <Text style={styles.text}>
              • Arrive 10 minutes before your scheduled time<br />
              • Wear comfortable, non-bright clothing<br />
              • Maintain silence during the feeding session<br />
              • Photography is encouraged!
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            You will receive a reminder on the morning of your new visit date. 
            If you need further assistance, please don't hesitate to contact us.
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
    color: '#2563eb',
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
  oldDetailsBox: {
    backgroundColor: '#f3f4f6',
    border: '2px solid #9ca3af',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0 16px',
  },
  oldDetailsHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#6b7280',
    margin: '0 0 16px',
    textDecoration: 'line-through',
  },
  arrowText: {
    fontSize: '32px',
    color: '#2563eb',
    textAlign: 'center' as const,
    margin: '0 0 16px',
    fontWeight: 'bold',
  },
  newDetailsBox: {
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    padding: '24px',
    margin: '16px 0 24px',
  },
  newDetailsHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e40af',
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
    color: '#2563eb',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
};
