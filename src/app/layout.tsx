import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Sans_Tamil } from "next/font/google";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import Script from "next/script";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const notoSansTamil = Noto_Sans_Tamil({
  weight: ["400", "500"],
  subsets: ["tamil"],
  variable: "--font-tamil",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://birdmanofchennai.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "The Birdman of Chennai — Sudarson Sah's Parakeet Sanctuary",
  description:
    "Witness the daily miracle of ~6,000 wild rose-ringed parakeets gathering at Mr. Sudarson Sah's rooftop sanctuary in Chintadripet, Chennai. Book your free visit and experience 16 years of extraordinary urban bird conservation.",
  keywords: [
    "Birdman of Chennai",
    "Sudarson Sah",
    "Kili Sudarson",
    "Chintadripet parakeet sanctuary",
    "rose-ringed parakeets Chennai",
    "Meiyazhagan film inspiration",
    "Chennai bird feeding",
    "Chennai tourism",
    "wildlife conservation Chennai",
    "Iyya Mudali Street",
  ],
  authors: [{ name: "Sudarson Sah" }],
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/',
      'ta-IN': '/ta',
    },
  },
  openGraph: {
    title: "The Birdman of Chennai — Where 6,000 Parakeets Come Home",
    description:
      "Every evening at 4:30 PM, ~6,000 wild rose-ringed parakeets descend on Sudarson Sah's rooftop in Chintadripet, Chennai. Witness this daily miracle — free entry, book your visit.",
    type: "website",
    url: BASE_URL,
    siteName: "Birdman of Chennai",
    locale: "en_IN",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 1200,
        alt: "Artistic depiction of Sudarson Sah (The Birdman of Chennai) feeding thousands of rose-ringed parakeets on his rooftop sanctuary",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Birdman of Chennai — Where 6,000 Parakeets Come Home",
    description:
      "Every evening, ~6,000 wild parakeets land on one man's rooftop in Chennai. Sudarson Sah has fed them daily for 16 years. Book a free visit.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${notoSansTamil.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden" suppressHydrationWarning>
        {children}
        <ScrollToTop />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "@id": `${BASE_URL}/#business`,
                "name": "Birdman of Chennai Parakeet Sanctuary",
                "alternateName": "Kili Sudarson's Sanctuary",
                "image": `${BASE_URL}/images/banner_hd.png`,
                "description": "A unique urban bird sanctuary in Chintadripet, Chennai, where ~6,000 wild rose-ringed parakeets are fed daily by Mr. Sudarson Sah. Inspired the Tamil film Meiyazhagan (2024). Free entry — book your visit.",
                "url": BASE_URL,
                "priceRange": "Free",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Iyya Mudali Street, Adikesavarpuram, Chintadripet",
                  "addressLocality": "Chennai",
                  "postalCode": "600002",
                  "addressRegion": "Tamil Nadu",
                  "addressCountry": "IN"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": 13.0768,
                  "longitude": 80.2677
                },
                "openingHoursSpecification": {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
                  "opens": "16:30",
                  "closes": "18:30"
                },
                "sameAs": [
                  "https://thefederal.com/category/features/meiyazhagan-chennai-birdman-parrots-167626",
                  "https://www.newindianexpress.com/magazine/2025/Aug/10/the-wind-beneath-their-wings",
                  "https://youtu.be/LnmCrESBe6k"
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "Person",
                "@id": `${BASE_URL}/#sudarson-sah`,
                "name": "Sudarson Sah",
                "alternateName": ["Kili Sudarson", "Parrot Sudarson", "Birdman of Chennai"],
                "jobTitle": "Urban Bird Conservationist",
                "description": "Sudarson Sah, known as the Birdman of Chennai, has fed ~6,000 wild rose-ringed parakeets daily on his rooftop in Chintadripet, Chennai, for over 16 years. His dedication inspired the Tamil film Meiyazhagan (2024) directed by C Prem Kumar, starring Arvind Swamy.",
                "birthPlace": { "@type": "Place", "name": "Chennai, Tamil Nadu, India" },
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Chennai",
                  "addressRegion": "Tamil Nadu",
                  "addressCountry": "IN"
                },
                "spouse": { "@type": "Person", "name": "Vithya Sah" },
                "knowsAbout": ["Rose-ringed Parakeets", "Urban Wildlife Conservation", "Bird Feeding"],
                "url": `${BASE_URL}/story`,
                "sameAs": [
                  "https://thefederal.com/category/features/meiyazhagan-chennai-birdman-parrots-167626",
                  "https://www.newindianexpress.com/magazine/2025/Aug/10/the-wind-beneath-their-wings",
                  "https://youtu.be/LnmCrESBe6k"
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "Event",
                "@id": `${BASE_URL}/#daily-feeding`,
                "name": "Daily Parakeet Feeding at Birdman of Chennai Sanctuary",
                "description": "Every evening, ~6,000 wild rose-ringed parakeets descend on Sudarson Sah's rooftop terrace in Chintadripet, Chennai, for their daily feeding. Free entry — visitors must book in advance and maintain silence during the feeding.",
                "image": `${BASE_URL}/images/banner_hd.png`,
                "startDate": "2026-01-01T16:30:00+05:30",
                "endDate": "2026-12-31T18:30:00+05:30",
                "eventSchedule": {
                  "@type": "Schedule",
                  "repeatFrequency": "P1D",
                  "startTime": "16:30",
                  "endTime": "18:30",
                  "scheduleTimezone": "Asia/Kolkata"
                },
                "isAccessibleForFree": true,
                "organizer": { "@id": `${BASE_URL}/#sudarson-sah` },
                "location": {
                  "@type": "Place",
                  "name": "Birdman of Chennai Parakeet Sanctuary",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Iyya Mudali Street, Adikesavarpuram, Chintadripet",
                    "addressLocality": "Chennai",
                    "postalCode": "600002",
                    "addressRegion": "Tamil Nadu",
                    "addressCountry": "IN"
                  }
                },
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "eventStatus": "https://schema.org/EventScheduled",
                "url": `${BASE_URL}/book`
              },
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "@id": `${BASE_URL}/#business`,
                "name": "Birdman of Chennai Parakeet Sanctuary",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "5",
                  "bestRating": "5",
                  "worstRating": "1",
                  "ratingCount": "14000",
                  "reviewCount": "3"
                },
                "review": [
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Priya Sundaram" },
                    "datePublished": "2026-03-01",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "An absolutely magical experience! Watching thousands of parakeets arrive at feeding time is something I will never forget. Mr. Sah is truly an inspiration."
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Raj Krishnamurthy" },
                    "datePublished": "2026-02-01",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "We visited during the evening session and it was breathtaking. The birds know him by heart. A must-visit for anyone in Chennai."
                  },
                  {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Sarah Mitchell" },
                    "datePublished": "2026-01-01",
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "I traveled from London specifically to see this. It exceeded all expectations. The connection between Mr. Sah and these birds is truly extraordinary."
                  }
                ]
              }
            ]),
          }}
        />
      </body>
    </html>
  );
}
