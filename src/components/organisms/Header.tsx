'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#about', label: 'About' },
    { href: '/#gallery', label: 'Gallery' },
    { href: '/feedback', label: 'Feedback' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-deep-night/95 backdrop-blur-sm shadow-md'
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-serif font-bold text-xl hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl" aria-hidden="true">🦜</span>
          <span className="hidden sm:inline">Birdman of Chennai</span>
          <span className="sm:hidden">Birdman</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-white hover:text-sunset-gold transition-colors font-medium"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Button asChild variant="primary" size="sm">
              <Link href="/book">Book Visit</Link>
            </Button>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-end md:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <nav
            className="relative w-4/5 max-w-xs h-full bg-mist-white/95 backdrop-blur-lg shadow-xl p-6 flex flex-col animate-slide-in-right"
            tabIndex={-1}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset-gold"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu | மெனுவை மூடு"
            >
              <X className="w-7 h-7 text-deep-night" />
            </button>
            {/* Menu items */}
            <ul className="mt-16 space-y-5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 text-deep-night hover:text-parakeet-green text-lg font-medium py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-sunset-gold"
                    onClick={() => setIsMobileMenuOpen(false)}
                    tabIndex={0}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <Button asChild variant="primary" size="lg" className="w-full h-12 text-lg rounded-lg">
                <Link href="/book" onClick={() => setIsMobileMenuOpen(false)}>
                  Book Your Visit
                </Link>
              </Button>
            </div>
          </nav>
          <style jsx>{`
            @keyframes slide-in-right {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in-right {
              animation: slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            }
          `}</style>
        </div>
      )}
    </header>
  );
}
