import 'dotenv/config';
import { getAdminDb } from '../src/lib/firebase/admin-runtime';
import { bookingSearchPrefixes } from '../src/lib/firebase/booking-search';

async function main() {
  const database = getAdminDb();
  const snapshot = await database.collection('bookings').get();
  let batch = database.batch();
  let pendingWrites = 0;
  let updated = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    const visitorName = String(data.visitorName ?? data.visitor_name ?? '');
    const phone = String(data.phone ?? '');
    const email = String(data.email ?? '');
    const prefixes = bookingSearchPrefixes([
      visitorName,
      phone.replace(/\D/g, ''),
      email,
    ]);

    batch.set(
      document.ref,
      {
        visitorNameLowercase: visitorName.trim().toLowerCase(),
        phoneNormalized: phone.replace(/\D/g, ''),
        emailLowercase: email.trim().toLowerCase(),
        searchPrefixes: prefixes,
      },
      { merge: true }
    );
    pendingWrites += 1;
    updated += 1;

    if (pendingWrites === 400) {
      await batch.commit();
      batch = database.batch();
      pendingWrites = 0;
    }
  }

  if (pendingWrites > 0) await batch.commit();
  console.log(`Backfilled search fields for ${updated} booking documents.`);
}

main().catch((error) => {
  console.error('Booking search backfill failed:', error);
  process.exitCode = 1;
});
