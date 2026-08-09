import { listApprovedFirestoreFeedbackPage } from '@/lib/firebase/feedback';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { FeedbackClient } from '@/components/organisms/FeedbackClient';

// Never prerender at build time — always render at request time so the
// DATABASE_URL env var is available (Vercel build env ≠ runtime env).
export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  let feedbackPage: Awaited<ReturnType<typeof listApprovedFirestoreFeedbackPage>> = {
    feedback: [],
    nextCursor: null,
    hasMore: false,
  };
  try {
    feedbackPage = await listApprovedFirestoreFeedbackPage(12);
  } catch (error) {
    console.error('[feedback-page] Failed to load approved feedback', error);
  }

  return (
    <>
      <Header />
      <FeedbackClient
        initialFeedback={feedbackPage.feedback}
        initialNextCursor={feedbackPage.nextCursor}
      />
      <Footer />
    </>
  );
}
