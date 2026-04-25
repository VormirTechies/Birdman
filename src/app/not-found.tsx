import Link from 'next/link';
import { Home, Bird } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f8f1d4]">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Bird className="w-32 h-32 text-[#2d6a4f] opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-bold text-[#2d6a4f]">404</span>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md mx-auto">
          Oops! You&apos;re lost in the jungle. Let&apos;s get you back on track.
        </p>

        {/* Go Home Button */}
        <Link href="/">
          <Button
            size="lg"
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            <Home className="mr-2 size-4" />
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
