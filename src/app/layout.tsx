import type { Metadata } from "next";
import { Merriweather, Inter, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-serif",
  display: 'swap',
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
});

const notoSansTamil = Noto_Sans_Tamil({
  weight: ['400', '500'],
  subsets: ["tamil"],
  variable: "--font-tamil",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "The Birdman of Chennai | Sudarson Sah's Parakeet Sanctuary",
  description: "Experience the daily miracle of thousands of wild parakeets gathering at Mr. Sudarson Sah's rooftop sanctuary in Chintadripet, Chennai. Book your visit to witness 16 years of dedication to bird conservation.",
  keywords: ["Birdman of Chennai", "Sudarson Sah", "Chintadripet", "Parakeet sanctuary", "Bird feeding", "Meiyazhagan", "Chennai tourism"],
  authors: [{ name: "Birdman of Chennai" }],
  openGraph: {
    title: "The Birdman of Chennai | Sudarson Sah's Parakeet Sanctuary",
    description: "Witness thousands of wild parakeets at Chennai's most unique urban sanctuary",
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
      className={`${merriweather.variable} ${inter.variable} ${notoSansTamil.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
