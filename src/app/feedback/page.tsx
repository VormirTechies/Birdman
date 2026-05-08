import { getApprovedFeedback } from '@/lib/db/queries';

export const revalidate = 1800;
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { FeedbackClient } from '@/components/organisms/FeedbackClient';

export default async function FeedbackPage() {
  const feedbackItems = await getApprovedFeedback(50);

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
