import { countGalleryImages, listPublicGalleryPage } from '@/lib/firebase/gallery';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { GalleryClient } from '@/components/organisms/GalleryClient';

// Never prerender at build time — DATABASE_URL is only available at request
// time in Vercel's serverless runtime, not in the build container.
export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  let page: Awaited<ReturnType<typeof listPublicGalleryPage>> = {
    images: [],
    pagination: { limit: 15, hasMore: false, nextCursor: null },
  };
  let totalCount = 0;
  try {
    [page, totalCount] = await Promise.all([
      listPublicGalleryPage(15),
      countGalleryImages(),
    ]);
  } catch {
    // DB unavailable during build — render with empty list
  }

  return (
    <>
      <Header />
      <GalleryClient
        initialImages={page.images}
        initialCursor={page.pagination.nextCursor}
        initialHasMore={page.pagination.hasMore}
        totalCount={totalCount}
        heroVideoUrl={process.env.GALLERY_HERO_VIDEO_URL}
      />
      <Footer />
    </>
  );
}
