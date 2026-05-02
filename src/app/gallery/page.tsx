import { getGalleryImagesPaginated, getGalleryCount } from '@/lib/db/queries';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { GalleryClient } from '@/components/organisms/GalleryClient';

export default async function GalleryPage() {
  const [images, totalCount] = await Promise.all([
    getGalleryImagesPaginated(0, 15),
    getGalleryCount(),
  ]);

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
