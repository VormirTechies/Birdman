import { getTodayBookings, getDashboardStats } from '@/lib/db/queries';
import { DashboardHero } from '@/components/organisms/admin/DashboardHero';

/* ════════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — Home (Today's Flights)
   ════════════════════════════════════════════════════════════════════════════ */

// This is a Server Component to fetch the latest data for initial load.
// Real-time updates handled by the 'RealtimeNotifier' layout component.
export default async function AdminDashboardPage() {
  const [todayBookings, stats] = await Promise.all([
    getTodayBookings(),
    getDashboardStats()
  ]);

  const initialBookings = todayBookings.map(b => ({
    id: b.id,
    visitorName: b.visitorName,
    phone: b.phone,
    email: b.email,
    numberOfGuests: b.numberOfGuests,
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime,
    status: b.status
  }));

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <DashboardHero 
        initialBookings={initialBookings} 
        initialStats={stats}
      />
    </main>
  );
}
