import { getDashboardStats } from '@/lib/db/queries';
import { DashboardV2 } from '@/components/organisms/admin/DashboardV2';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-1000">
      <DashboardV2 initialStats={stats} />
    </main>
  );
}
