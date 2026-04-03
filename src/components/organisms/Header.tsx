'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bird, Calendar, Home, BookOpen, ImageIcon, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/story', label: 'His Story', icon: BookOpen },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

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
        isScrolled || !isHome
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
            <Bird
              className={cn(
                'w-7 h-7 transition-colors duration-300',
                isScrolled || !isHome
                  ? 'text-sanctuary-green'
                  : 'text-white'
              )}
            />
          </motion.div>
          <span
            className={cn(
              'font-display font-bold text-lg md:text-xl tracking-tight transition-colors duration-300',
              isScrolled || !isHome ? 'text-canopy-dark' : 'text-white'
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
                  isScrolled || !isHome
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
                      isScrolled || !isHome ? 'bg-sanctuary-green' : 'bg-white'
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
              className="bg-sanctuary-green hover:bg-canopy-dark text-white rounded-full px-5 gap-2 shadow-glow-green transition-all duration-300 hover:shadow-lg"
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
                  isScrolled || !isHome
                    ? 'text-canopy-dark hover:bg-morning-mist'
                    : 'text-white hover:bg-white/10'
                )}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[450px] bg-canopy-dark/95 text-white backdrop-blur-2xl border-l-white/10 p-0 flex flex-col h-full shadow-2xl overflow-hidden [&>button]:hidden">
              <div className="flex flex-col h-full max-h-[100dvh]">
                {/* Mobile Header Banner */}
                <div className="relative h-44 bg-nature-gradient flex items-end p-6 border-b border-sanctuary-green/10 flex-shrink-0">
                  <div className="absolute inset-0 bg-hero-overlay/30 mix-blend-overlay"></div>
                  
                  {/* Close button re-implemented here for better positioning in banner */}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all sm:hidden"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>

                  <SheetHeader className="relative z-10 p-0 text-left">
                    <SheetTitle className="flex flex-col items-start gap-3 font-display text-white text-[1.65rem] tracking-tight">
                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-white">
                        <Bird className="w-7 h-7 drop-shadow-sm" />
                      </div>
                      <span className="mt-1 leading-none text-shadow-sm text-white">Birdman of Chennai</span>
                    </SheetTitle>
                  </SheetHeader>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-3">
                  {navLinks.map((link, i) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, ease: "easeOut" }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-medium transition-all group border',
                            isActive
                              ? 'bg-sanctuary-green text-white border-sanctuary-green shadow-lg shadow-sanctuary-green/30'
                              : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white border-transparent shadow-none'
                          )}
                        >
                          <Icon className={cn("w-[22px] h-[22px] transition-transform group-hover:scale-110", isActive ? "text-white" : "text-white/70")} />
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-night-sky border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-8 mt-auto flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      asChild
                      className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-2xl h-14 text-lg gap-3 shadow-xl hover:shadow-glow-green transition-all hover:-translate-y-1"
                    >
                      <Link href="/book" onClick={() => setIsOpen(false)}>
                        <Calendar className="w-5 h-5 flex-shrink-0" />
                        <span>Book Your Visit</span>
                      </Link>
                    </Button>
                  </motion.div>

                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50 uppercase tracking-widest font-semibold pb-2">
                    <span>Est 2006</span>
                    <span className="w-1 h-1 rounded-full bg-sanctuary-green opacity-50"></span>
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
