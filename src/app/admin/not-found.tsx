import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f8f1d4]">
          <div className="max-w-2xl w-full text-center">
            {/* 404 Image with Parakeets */}
            <div className="mb-6 flex justify-center">
              <div className="relative w-full h-64 md:h-80">
                <Image
                  src="/images/404.png"
                  alt="404 - Parakeets on numbers"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
    
            {/* Main Heading */}
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 font-family-body">
              404 - Page Not Found
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
                <LayoutDashboard className="mr-2 size-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
    </div>
  );
}
