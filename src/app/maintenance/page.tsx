import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Mail, Wrench } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";

export const metadata: Metadata = {
  title: "Visit bookings temporarily paused",
  description: "Visit bookings are temporarily paused while we upgrade our booking system. Explore our website and check back soon.",
  alternates: { canonical: "/maintenance" },
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <>
    <Header />
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-feather-cream px-6 py-12 text-canopy-dark">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sanctuary-green/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-golden-hour/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-2xl text-center">
        <Image
          src="/images/parrot_logo.png"
          alt="Birdman of Chennai parrot logo"
          width={96}
          height={96}
          priority
          className="mx-auto mb-5 h-24 w-24 object-contain"
        />
        <p className="mb-12 text-sm font-semibold uppercase tracking-[0.2em]">Birdman of Chennai</p>

        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-sanctuary-green/20 bg-white/80 px-4 py-2 text-sm font-medium">
          <Wrench aria-hidden="true" className="h-4 w-4 text-sanctuary-green" />
          Booking maintenance
        </div>
        <h1 className="text-4xl leading-tight sm:text-6xl">A little pause.<br />We&apos;ll be back soon.</h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-canopy-dark/75 sm:text-lg">
          We&apos;re upgrading our booking system. Visit bookings are temporarily paused until the upgrade is complete. You can still explore our story, gallery, and the rest of our website.
        </p>
        <p className="mt-4 text-sm text-canopy-dark/75">Thank you for your patience and support.</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* A full navigation rechecks maintenance mode instead of reusing a prefetched route. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-canopy-dark px-7 py-3 font-semibold text-white transition-colors hover:bg-sanctuary-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canopy-dark sm:w-auto">
            Explore the website
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <a href={`mailto:${siteConfig.email}`} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-canopy-dark/20 bg-white/60 px-7 py-3 font-semibold transition-colors hover:bg-morning-mist focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canopy-dark sm:w-auto">
            <Mail aria-hidden="true" className="h-4 w-4" />
            Contact us
          </a>
        </div>
        <p className="mt-16 text-xs tracking-wide text-canopy-dark/65">With love, from our rooftop in Chennai.</p>
      </div>
    </main>
    <Footer />
    </>
  );
}
