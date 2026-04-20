import { getDashboardStats } from '@/lib/db/queries';
import { DashboardV2 } from '@/components/organisms/admin/DashboardV2';

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <DashboardV2 initialStats={stats} />
    </main>
  );
}
