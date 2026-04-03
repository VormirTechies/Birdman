import { getGalleryImages } from '@/lib/db/queries';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { GalleryClient } from '@/components/organisms/GalleryClient';

export default async function GalleryPage() {
  const images = await getGalleryImages();

  // Transform for the client component
  // Default to portrait aspect if not specified (matches masonry look)
  const transformedImages = images.map(img => ({
    src: img.url,
    alt: img.caption || 'Parakeet at Birdman Sanctuary',
    caption: img.caption || '',
    category: ['all', 'parakeets'] as any[], // Default for now
    aspect: 'portrait' as const
  }));

  return (
    <>
      <Header />
      <GalleryClient initialImages={transformedImages} />
      <Footer />
    </>
  );
}
