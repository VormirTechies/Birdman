import {
  Html, Head, Body, Container, Heading, Text, Section, Hr, Img,
} from '@react-email/components';
import React from 'react';

interface Props {
  visitorName: string;
  bookingDate: string;
  numberOfGuests: number;
}

export default function BookingCancelledBlocked({
  visitorName, bookingDate, numberOfGuests,
}: Props) {
  const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Important Update Regarding Your Visit</Heading>
          
          <Text style={styles.greeting}>Dear {visitorName},</Text>
          
          <Text style={styles.text}>
            We are writing to inform you that we must unfortunately <strong>cancel your booking</strong> for {numberOfGuests} guests on {formattedDate}.
          </Text>

          <Text style={styles.text}>
            The sanctuary is being temporarily closed on this date due to unforeseen maintenance or a private commitment. Since this is a home-run initiative operated out of goodwill, we sometimes have to adjust our schedule.
          </Text>

          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Action Required</Text>
            <Text style={styles.detail}>
              Please visit our website to rebook your visit for another available date.
              We sincerely apologize for the inconvenience and hope to welcome you soon!
            </Text>
            <Text style={styles.text}>
              <a href="https://birdman.vercel.app/book" style={styles.link}>Book a New Date →</a>
            </Text>
          </Section>

          <Hr style={styles.hr} />

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
  body: { backgroundColor: '#f6f9fc', fontFamily: '-apple-system, sans-serif' },
  container: { backgroundColor: '#ffffff', margin: '0 auto', padding: '40px 20px', maxWidth: '600px', borderRadius: '8px' },
  heading: { color: '#dc2626', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' as const, margin: '0 0 30px' },
  greeting: { fontSize: '18px', color: '#1f2937', margin: '0 0 16px' },
  text: { fontSize: '16px', color: '#4b5563', lineHeight: '24px', margin: '0 0 16px' },
  detailsBox: { backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '8px', padding: '24px', margin: '24px 0' },
  detailsHeading: { fontSize: '18px', fontWeight: 'bold', color: '#b91c1c', margin: '0 0 16px' },
  detail: { fontSize: '16px', color: '#1f2937', margin: '8px 0 16px' },
  hr: { borderColor: '#e5e7eb', margin: '32px 0' },
  signature: { fontSize: '16px', color: '#1f2937', margin: '16px 0 0' },
  link: { color: '#dc2626', textDecoration: 'none', fontWeight: 'bold' },
};
