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

interface BookingReminderProps {
  visitorName: string;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
}

export default function BookingReminder({
  visitorName,
  bookingDate,
  bookingTime,
  numberOfGuests,
}: BookingReminderProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>🦜 Your Visit is Today!</Heading>
          
          <Text style={styles.greeting}>Dear {visitorName},</Text>
          
          <Text style={styles.text}>
            This is a friendly reminder that your visit to the Birdman of Chennai 
            is scheduled for <strong>today</strong> at <strong>{bookingTime}</strong>.
          </Text>

          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Today's Visit Details</Text>
            
            <Text style={styles.detail}>
              <strong>Time:</strong> {bookingTime}
            </Text>
            
            <Text style={styles.detail}>
              <strong>Number of Guests:</strong> {numberOfGuests}
            </Text>
          </Section>

          <Section style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⏰ Please arrive 10 minutes early to ensure you don't miss the feeding!
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Section>
            <Text style={styles.sectionHeading}>📍 Location</Text>
            <Text style={styles.text}>
              Birdman of Chennai<br />
              Velachery, Chennai, Tamil Nadu
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionHeading}>✅ Pre-Visit Checklist</Text>
            <Text style={styles.text}>
              • Wear comfortable, non-bright clothing<br />
              • Bring your camera or phone for photos<br />
              • Arrive 10 minutes before {bookingTime}<br />
              • Prepare to maintain silence during feeding
            </Text>
          </Section>

          <Section>
            <Text style={styles.sectionHeading}>🚫 Important Don'ts</Text>
            <Text style={styles.text}>
              • Don't bring pets<br />
              • Don't wear bright colors<br />
              • Don't make loud noises<br />
              • Don't try to touch or feed the birds yourself
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            We're excited to share this magical experience with you. See you soon!
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
    color: '#dc2626',
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
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
  },
  detailsHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#991b1b',
    margin: '0 0 16px',
  },
  detail: {
    fontSize: '16px',
    color: '#1f2937',
    margin: '8px 0',
  },
  alertBox: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
  },
  alertText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#92400e',
    margin: '0',
    textAlign: 'center' as const,
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
};
