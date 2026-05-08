import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Book a Visit — Birdman of Chennai Parakeet Sanctuary',
  description:
    'Book your free visit to watch ~6,000 wild rose-ringed parakeets at Sudarson Sah\'s rooftop sanctuary in Chintadripet, Chennai. Sessions run daily 4:30 PM–6:30 PM. Silence required; children welcome.',
  alternates: { canonical: '/book' },
  openGraph: {
    title: 'Book a Free Visit — Birdman of Chennai',
    description:
      'Reserve your spot to witness ~6,000 wild parakeets at Sudarson Sah\'s Chintadripet rooftop. Daily sessions 4:30–6:30 PM. Free entry, advance booking required.',
    images: [
      {
        url: '/images/banner_hd.png',
        width: 1200,
        height: 630,
        alt: 'Wild parakeets feeding at sunset on a Chennai rooftop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book a Free Visit — Birdman of Chennai',
    description:
      'Reserve your spot to witness ~6,000 wild parakeets. Daily sessions 4:30–6:30 PM. Free entry.',
    images: ['/images/banner_hd.png'],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does it cost to visit the Birdman of Chennai sanctuary?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Visits are completely free. Mr. Sudarson Sah does not charge for entry. However, advance booking is required as capacity is limited.',
      },
    },
    {
      '@type': 'Question',
      name: 'What time is the parakeet feeding at Chintadripet?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The daily feeding session runs from approximately 4:30 PM to 6:30 PM every day of the week.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many parakeets visit Sudarson Sah every day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Approximately 6,000 wild rose-ringed parakeets gather on Mr. Sudarson Sah\'s rooftop in Chintadripet, Chennai, for their daily feeding.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where is the Birdman of Chennai located?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The sanctuary is located on Iyya Mudali Street, Adikesavarpuram, Chintadripet, Chennai 600002, Tamil Nadu, India.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can children visit the sanctuary?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, children are welcome. Visitors of all ages are asked to maintain silence during the feeding session so as not to disturb the parakeets.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Birdman of Chennai the inspiration for Meiyazhagan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Sudarson Sah\'s story inspired the 2024 Tamil film Meiyazhagan, directed by C Prem Kumar and starring Arvind Swamy.',
      },
    },
  ],
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
      name: 'Book a Visit',
      item: 'https://birdmanofchennai.com/book',
    },
  ],
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="book-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, breadcrumbSchema]),
        }}
      />
      {children}
    </>
  );
}
