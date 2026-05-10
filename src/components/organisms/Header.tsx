'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Calendar, Home, BookOpen, ImageIcon, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/story', label: 'His Story', icon: BookOpen },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  // { href: '/feedback', label: 'Feedback', icon: MessageSquare },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // Pages with a full-bleed hero — header starts transparent and goes white on scroll
  const isTransparentTop = !pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled || !isTransparentTop
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-sanctuary-green/10'
          : 'bg-transparent'
      )}
    >
      <nav className="container-wide flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
      
            <Image src="/images/parrot_logo.png" alt="Parrot Logo" width={28} height={28} />
          </motion.div>
          <span
            className={cn(
              'font-display font-bold text-lg md:text-xl tracking-tight transition-colors duration-300',
              isScrolled || !isTransparentTop ? 'text-canopy-dark' : 'text-white'
            )}
          >
            Birdman<span className="hidden sm:inline"> of Chennai</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300',
                  isScrolled || !isTransparentTop
                    ? isActive
                      ? 'text-sanctuary-green bg-morning-mist'
                      : 'text-canopy-dark/70 hover:text-sanctuary-green hover:bg-morning-mist/50'
                    : isActive
                      ? 'text-white bg-white/15'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={cn(
                      'absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                      isScrolled || !isTransparentTop ? 'bg-sanctuary-green' : 'bg-white'
                    )}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          <div className="ml-3">
            <Button
              asChild
              size="sm"
              className="bg-sanctuary-green hover:bg-canopy-dark text-white rounded-full px-5 py-4 gap-2 shadow-glow-green transition-all duration-300 hover:shadow-lg"
            >
              <Link href="/book">
                <Calendar className="w-4 h-4" />
                Book Visit
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  isScrolled || !isTransparentTop
                    ? 'text-canopy-dark hover:bg-morning-mist'
                    : 'text-white hover:bg-white/10'
                )}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[95vw] sm:w-full bg-emerald-50/80 backdrop-blur-md  p-0 flex flex-col h-full shadow-2xl shadow-canopy-dark overflow-hidden [&>button]:hidden">
              <div className="flex flex-col h-full max-h-dvh">

                {/* Compact Green Header Strip */}
                <div className="flex items-center justify-between px-5 h-20 bg-transparent shrink-0">
                  <SheetHeader className="p-0">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="p-2 bg-white/15 rounded-xl shadow-2xl">
                        <Image src="/images/parrot_logo.png" alt="Parrot Logo" width={30} height={30} />
                      </div>
                      {/* <span className="font-display font-bold text-lg text-sanctuary-green tracking-tight leading-none">
                        Birdman of Chennai
                      </span> */}
                    </SheetTitle>
                  </SheetHeader>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-sanctuary-green transition-colors"
                    aria-label="Close menu"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3">
                  {navLinks.map((link, i) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07, ease: 'easeOut' }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-4 px-4 py-2 rounded-lg text-base transition-all group',
                            isActive
                              ? 'border-l-4 border-sanctuary-green bg-morning-mist'
                              : 'hover:bg-morning-mist/60'
                          )}
                        >
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            isActive
                              ? 'bg-sanctuary-green/15'
                              : 'bg-transparent group-hover:bg-sanctuary-green/10'
                          )}>
                            <Icon className={cn(
                              'w-5 h-5 transition-colors',
                              isActive
                                ? 'text-sanctuary-green'
                                : 'text-canopy-dark/50 group-hover:text-sanctuary-green'
                            )} />
                          </div>
                          <span className={cn(
                            'font-family-body font-bold',
                            isActive ? 'text-sanctuary-green' : 'text-canopy-dark'
                          )}>
                            {link.label}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="px-5 pt-5 pb-8  border-t border-canopy-dark/8 shrink-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Button
                      asChild
                      className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-2xl h-14 text-base font-semibold gap-2.5 shadow-lg shadow-sanctuary-green/20 hover:shadow-glow-green transition-all hover:-translate-y-0.5"
                    >
                      <Link href="/book" onClick={() => setIsOpen(false)}>
                        <Calendar className="w-5 h-5 shrink-0" />
                        <span>Book Your Visit</span>
                      </Link>
                    </Button>
                  </motion.div>

                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-canopy-dark/35 uppercase tracking-widest font-semibold">
                    <span>Est 2006</span>
                    <span className="w-1 h-1 rounded-full bg-canopy-dark/20"></span>
                    <span className="flex items-center gap-1.5">Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /></span>
                  </div>
                </div>

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
