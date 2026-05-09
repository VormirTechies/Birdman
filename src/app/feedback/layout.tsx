import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Visitor Feedback — Birdman of Chennai',
  description:
    'Read what visitors say about their experience at Sudarson Sah\'s parakeet sanctuary in Chintadripet, Chennai, and share your own memories of watching ~6,000 wild parakeets.',
  alternates: { canonical: '/feedback' },
  openGraph: {
    title: 'Visitor Feedback — Birdman of Chennai',
    description:
      'Read visitor stories and share your experience from the Birdman of Chennai parakeet sanctuary.',
    images: [
      {
        url: '/images/banner_hd.png',
        width: 1200,
        height: 630,
        alt: 'Visitors watching wild parakeets at Sudarson Sah\'s rooftop sanctuary in Chennai',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Visitor Feedback — Birdman of Chennai',
    description: 'Read and share visitor experiences at the Birdman of Chennai parakeet sanctuary.',
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
      name: 'Visitor Feedback',
      item: 'https://birdmanofchennai.com/feedback',
    },
  ],
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="feedback-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
