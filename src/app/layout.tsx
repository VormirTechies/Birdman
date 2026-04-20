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

export const metadata: Metadata = {
  title: "The Birdman of Chennai — Sudarson Sah's Parakeet Sanctuary",
  description:
    "Witness the daily miracle of 4,000 wild parakeets gathering at Mr. Sudarson Sah's rooftop sanctuary in Chintadripet, Chennai. Book your visit to experience 16+ years of extraordinary bird conservation.",
  keywords: [
    "Birdman of Chennai",
    "Sudarson Sah",
    "Chintadripet",
    "Parakeet sanctuary",
    "Bird feeding",
    "Meiyazhagan",
    "Chennai tourism",
    "Wildlife conservation",
  ],
  authors: [{ name: "Birdman of Chennai" }],
  openGraph: {
    title: "The Birdman of Chennai — Where 4,000 Parakeets Come Home",
    description:
      "Experience the daily miracle at Chennai's most unique urban bird sanctuary",
    type: "website",
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
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${notoSansTamil.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden">
        {children}
        <ScrollToTop />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Birdman of Chennai Parakeet Sanctuary",
              "image": "https://birdmanofchennai.com/images/banner_hd.png",
              "description": "A unique urban bird sanctuary in Chennai where 4,000 wild parakeets are fed daily by Mr. Sudarson Sah.",
              "@id": "https://birdmanofchennai.com",
              "url": "https://birdmanofchennai.com",
              "telephone": "+91 98765 43210",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "2/3, Iyya Mudali St, Adikesavarpuram, Chintadripet",
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
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "16:30",
                "closes": "18:30"
              }
            }),
          }}
        />
      </body>
    </html>
  );
}
