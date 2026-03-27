import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-deep-night text-white">
      {/* CTA Section */}
      <section className="border-b border-white/10">
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-6xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Visit?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Experience the daily miracle of thousands of wild parakeets at Chennai&apos;s most unique urban sanctuary
          </p>
          <Button asChild size="lg" variant="primary">
            <Link href="/book">Book Your Visit</Link>
          </Button>
        </div>
      </section>

      {/* Footer Info */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-xl mb-4">Location</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-parakeet-green shrink-0 mt-1" />
              <div>
                <p className="text-white/90">Chintadripet</p>
                <p className="text-white/90">Chennai, Tamil Nadu</p>
                <a
                  href="https://maps.app.goo.gl/QKYjGCQ2UUAhCiia8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-parakeet-green hover:text-sunset-gold transition-colors text-sm mt-2 inline-block"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-xl mb-4">Contact</h3>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-parakeet-green shrink-0" />
              <a
                href="tel:+919876543210"
                className="text-white/90 hover:text-parakeet-green transition-colors"
              >
                +91 98765 43210
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-parakeet-green shrink-0" />
              <a
                href="mailto:info@birdmanofchennai.com"
                className="text-white/90 hover:text-parakeet-green transition-colors"
              >
                info@birdmanofchennai.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-xl mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#about"
                  className="text-white/90 hover:text-parakeet-green transition-colors"
                >
                  About the Sanctuary
                </Link>
              </li>
              <li>
                <Link
                  href="/#gallery"
                  className="text-white/90 hover:text-parakeet-green transition-colors"
                >
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-white/90 hover:text-parakeet-green transition-colors"
                >
                  Visitor Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/feedback/submit"
                  className="text-white/90 hover:text-parakeet-green transition-colors"
                >
                  Share Your Experience
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/60 text-sm">
          <p>
            © {new Date().getFullYear()} Birdman of Chennai. All rights reserved.
          </p>
          <p className="mt-2">
            Built with ❤️ to celebrate 16+ years of wildlife conservation
          </p>
        </div>
      </div>
    </footer>
  );
}
