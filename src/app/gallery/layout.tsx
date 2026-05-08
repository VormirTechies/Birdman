import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Gallery — Birdman of Chennai Parakeet Sanctuary',
  description:
    'Browse photos and videos of ~6,000 wild rose-ringed parakeets gathering at Sudarson Sah\'s rooftop sanctuary in Chintadripet, Chennai.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Gallery — Birdman of Chennai',
    description:
      'A visual journey through one of Chennai\'s most extraordinary natural spectacles — thousands of wild parakeets returning to their urban rooftop sanctuary every evening.',
    images: [
      {
        url: '/images/banner_hd.png',
        width: 1200,
        height: 630,
        alt: 'Wild rose-ringed parakeets in flight over a Chennai rooftop at sunset',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery — Birdman of Chennai',
    description:
      'Photos and videos of ~6,000 wild parakeets at Sudarson Sah\'s rooftop sanctuary in Chennai.',
    images: ['/images/banner_hd.png'],
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://birdmanofchennai.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Gallery',
      item: 'https://birdmanofchennai.com/gallery',
    },
  ],
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="gallery-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
