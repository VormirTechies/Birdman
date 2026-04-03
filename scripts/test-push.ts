import { config } from 'dotenv';
config({ path: '.env.local' });

const { sendPushToAllAdmins } = await import('../src/lib/push');

async function main() {
  console.log('🦜 Starting sanctuary push diagnostic test...');
  
  try {
    await sendPushToAllAdmins({
      title: '🕊️ Emergency Emerald Flight Alert!',
      body: 'Diagnostics check: This is a manual test of the sanctuary push notification engine.',
      url: '/admin'
    });
    console.log('✅ Push diagnostic script completed check.');
  } catch (error) {
    console.error('❌ Diagnostic push failed:', error);
  }
}

main();
