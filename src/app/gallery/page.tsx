import { getGalleryImagesPaginated, getGalleryCount } from '@/lib/db/queries';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { GalleryClient } from '@/components/organisms/GalleryClient';

// Never prerender at build time — DATABASE_URL is only available at request
// time in Vercel's serverless runtime, not in the build container.
export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  let images: Awaited<ReturnType<typeof getGalleryImagesPaginated>> = [];
  let totalCount = 0;
  try {
    [images, totalCount] = await Promise.all([
      getGalleryImagesPaginated(0, 15),
      getGalleryCount(),
    ]);
  } catch {
    // DB unavailable during build — render with empty list
  }

  const initialImages = images.map((img) => ({
    id: img.id,
    src: img.url,
    title: img.altText || img.caption || 'Parakeet at Birdman Sanctuary',
    description: img.caption ?? undefined,
    aspect: (img.aspect as 'portrait' | 'landscape' | 'square') || 'square',
  }));

  return (
    <>
      <Header />
      <GalleryClient initialImages={initialImages} totalCount={totalCount} />
      <Footer />
    </>
  );
}
