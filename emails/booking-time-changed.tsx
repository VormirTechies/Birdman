import {
  Html, Head, Body, Container, Heading, Text, Section, Hr,
} from '@react-email/components';
import React from 'react';

interface Props {
  visitorName: string;
  bookingDate: string;
  newTime: string;
  numberOfGuests: number;
}

export default function BookingTimeChanged({
  visitorName, bookingDate, newTime, numberOfGuests,
}: Props) {
  const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Time Update for Your Visit ⏰</Heading>
          
          <Text style={styles.greeting}>Dear {visitorName},</Text>
          
          <Text style={styles.text}>
            There has been a slight change to your upcoming visit for {numberOfGuests} guests on <strong>{formattedDate}</strong>.
          </Text>

          <Section style={styles.detailsBox}>
            <Text style={styles.detailsHeading}>Updated Arrival Time</Text>
            <Text style={styles.detail}>
              Your new arrival time is: <strong>{newTime} PM</strong>
            </Text>
            <Text style={styles.subtext}>
              Please arrive exactly at this time, as the gathering corresponds to sunset.
            </Text>
          </Section>

          <Text style={styles.text}>
            If you can no longer make it at this time, please reply to this email, or ignore this message if the new time works for you!
          </Text>

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
  heading: { color: '#d97706', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' as const, margin: '0 0 30px' },
  greeting: { fontSize: '18px', color: '#1f2937', margin: '0 0 16px' },
  text: { fontSize: '16px', color: '#4b5563', lineHeight: '24px', margin: '0 0 16px' },
  detailsBox: { backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '8px', padding: '24px', margin: '24px 0' },
  detailsHeading: { fontSize: '18px', fontWeight: 'bold', color: '#b45309', margin: '0 0 12px' },
  detail: { fontSize: '20px', color: '#1f2937', margin: '0 0 8px' },
  subtext: { fontSize: '14px', color: '#92400e', margin: '0' },
  hr: { borderColor: '#e5e7eb', margin: '32px 0' },
  signature: { fontSize: '16px', color: '#1f2937', margin: '16px 0 0' },
};
