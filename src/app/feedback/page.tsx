import { getApprovedFeedback } from '@/lib/db/queries';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { FeedbackClient } from '@/components/organisms/FeedbackClient';

// Never prerender at build time — always render at request time so the
// DATABASE_URL env var is available (Vercel build env ≠ runtime env).
export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  let feedbackItems: Awaited<ReturnType<typeof getApprovedFeedback>> = [];
  try {
    feedbackItems = await getApprovedFeedback(50);
  } catch {
    // DB unavailable (e.g. during build) — render with empty list
  }

  // Transform for the client component
  const transformedFeedback = feedbackItems.map(item => ({
    id: item.id,
    name: item.visitorName || 'Anonymous Visitor',
    rating: item.rating || 5,
    message: item.message,
    visitDate: item.visitDate ? new Date(item.visitDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent Visitor'
  }));

  return (
    <>
      <Header />
      <FeedbackClient initialFeedback={transformedFeedback} />
      <Footer />
    </>
  );
}
