'use client';

import Link from 'next/link';
import { MapPin, Mail, Heart, ArrowUp } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/animated-section';
import { FloatingParticles } from '@/components/ui/floating-particles';
import Image from 'next/image';

const quickLinks = [
  { href: '/story', label: 'His Story' },
  { href: '/gallery', label: 'Photo Gallery' },
  { href: '/book', label: 'Book a Visit' },
  { href: '/feedback', label: 'Visitor Reviews' },
];

const visitInfo = [
  { label: 'Visiting Session', detail: '4:30 PM — 6:30 PM' },
  { label: 'Entry Fee', detail: 'Free' },
  { label: 'Best Season', detail: 'Year-round' },
];

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-canopy-dark text-white overflow-hidden">
      {/* Organic wave top border */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden leading-[0]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          className="w-full h-[60px] block"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,0 L0,0 Z"
            fill="var(--color-feather-cream)"
          />
        </svg>
      </div>

      <FloatingParticles count={8} color="rgba(255, 255, 255, 0.15)" />

      {/* CTA Section */}
      <AnimatedSection className="pt-24 pb-16 relative z-10">
        <div className="container-wide text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Ready to Witness the Magic?
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
            Visit the sanctuary where 4,000 wild parakeets gather daily — a
            once-in-a-lifetime experience awaits you.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-golden-hour hover:bg-sunset-amber text-canopy-dark font-semibold px-8 py-3.5 rounded-full transition-all duration-300 hover:shadow-glow-gold text-base"
          >
            {/* <Bird className="w-5 h-5" /> */}

            <Image src="/images/parrot_logo.png" alt="Parrot Logo" width={28} height={28} />
            Book Your Visit
          </Link>
        </div>
      </AnimatedSection>

      {/* Footer Grid */}
      <div className="border-t border-white/10">
        <div className="container-wide py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                {/* <Bird className="w-6 h-6 text-sanctuary-green-light" /> */}
                <Image src="/images/parrot_logo.png" alt="Parrot Logo" width={28} height={28} />
                <span className="font-display font-bold text-lg">
                  Birdman of Chennai
                </span>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed">
                For over 16 years, Mr. Sudarson Sah has dedicated his life to
                feeding and caring for thousands of wild parakeets on his
                rooftop in Chennai.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-display font-bold text-base mb-4">
                Explore
              </h3>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/60 hover:text-sanctuary-green-light transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visit Info */}
            <div>
              <h3 className="font-display font-bold text-base mb-4">
                Visit Info
              </h3>
              <ul className="space-y-2.5">
                {visitInfo.map((item) => (
                  <li key={item.label} className="text-sm">
                    <span className="text-white/40 block text-xs uppercase tracking-wider">
                      {item.label}
                    </span>
                    <span className="text-white/80">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display font-bold text-base mb-4">
                Contact
              </h3>
              <div className="space-y-3">
                <a
                  href={process.env.NEXT_PUBLIC_MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-white/60 hover:text-sanctuary-green-light transition-all text-sm group"
                >
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-sanctuary-green-light group-hover:scale-110 transition-transform" />
                  <span>{process.env.NEXT_PUBLIC_MAP_ADDRESS}</span>
                </a>
                <a
                  href="mailto:info@birdmanofchennai.com"
                  className="flex items-center gap-2.5 text-white/60 hover:text-sanctuary-green-light transition-colors text-sm"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>info@birdmanofchennai.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 relative z-10">
        <div className="container-wide py-6 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <p className="text-white/40 text-xs leading-loose">
            © {new Date().getFullYear()} Birdman of Chennai <br className="sm:hidden" /> Created by Vormir Techies with <Heart className="inline-block w-3.5 h-3.5 mx-0.5 text-red-500 fill-red-500" /> for wildlife conservation
          </p>
          <button
            onClick={scrollToTop}
            className="text-white/40 hover:text-sanctuary-green-light transition-colors flex items-center justify-center gap-1.5 text-xs w-full md:w-auto"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
