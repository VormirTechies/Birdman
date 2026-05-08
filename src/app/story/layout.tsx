import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Sudarson Sah — The Birdman of Chennai | 16 Years of Wild Parakeets',
  description:
    'The extraordinary story of Sudarson Sah, known as "Kili Sudarson," who for over 16 years has fed ~6,000 wild rose-ringed parakeets daily on his rooftop in Chintadripet, Chennai — inspiring the Tamil film Meiyazhagan (2024).',
  alternates: { canonical: '/story' },
  openGraph: {
    title: 'Sudarson Sah — The Birdman of Chennai',
    description:
      'How one man\'s devotion turned a Chennai rooftop into a sanctuary for ~6,000 wild parakeets. The real story behind the Tamil film Meiyazhagan (2024).',
    images: [
      {
        url: '/images/banner_hd.png',
        width: 1200,
        height: 630,
        alt: 'Sudarson Sah with thousands of wild rose-ringed parakeets on his rooftop in Chennai',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sudarson Sah — The Birdman of Chennai',
    description:
      'How one man\'s devotion turned a Chennai rooftop into a sanctuary for ~6,000 wild parakeets. The real story behind Meiyazhagan (2024).',
    images: ['/images/banner_hd.png'],
  },
};

const videoObjectSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'The Birdman of Chennai — Sudarson Sah Story',
  description:
    'Watch ~6,000 wild rose-ringed parakeets descend on Sudarson Sah\'s rooftop in Chintadripet, Chennai, for their daily evening feeding.',
  thumbnailUrl: 'https://birdmanofchennai.com/images/banner_hd.png',
  uploadDate: '2024-01-01',
  contentUrl:
    'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/videos/Birdman_story_wide.mp4',
  author: { '@id': 'https://birdmanofchennai.com/#sudarson-sah' },
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
      name: 'The Story',
      item: 'https://birdmanofchennai.com/story',
    },
  ],
};

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="story-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([videoObjectSchema, breadcrumbSchema]),
        }}
      />
      {children}
    </>
  );
}
