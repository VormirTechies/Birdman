import { v4 as uuidv4 } from 'uuid';

async function main() {
  const { config } = await import('dotenv');
  config({ path: '.env.local' });
  
  // Load lib after env config is fully applied
  const { sendBookingConfirmation } = await import('../src/lib/email');
  
  const testEmail = 'vigneshwaran7797@gmail.com';
  
  console.log(`🦜 Preparing test emerald-flight confirmation for: ${testEmail}...`);

  const mockBooking = {
    id: uuidv4(),
    visitorName: 'Vigneshwaran',
    phone: '+91-9876543210',
    email: testEmail,
    numberOfGuests: 2,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '06:30 AM',
    confirmationSent: false,
    reminderSent: false,
    reminderSentAt: null,
    status: 'confirmed' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await sendBookingConfirmation(mockBooking);
    
    if (result.success) {
      console.log('✅ Test confirmation sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
  } catch (err) {
    console.error('💥 Exception during email test:', err);
  }
}

main();
