import { BookingClient } from '@/components/organisms/BookingClient';
import MaintenancePage from '@/app/maintenance/page';
import { isBookingMaintenanceEnabled } from '@/lib/booking-maintenance';

export const dynamic = 'force-dynamic';

export default function BookPage() {
  if (isBookingMaintenanceEnabled()) return <MaintenancePage />;
  return <BookingClient />;
}
