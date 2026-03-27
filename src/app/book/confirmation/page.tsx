import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Calendar, Mail, Home } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-parchment py-24 md:py-32">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>

            {/* Success Message */}
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-deep-night mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-deep-night/70 text-lg mb-8">
              Your visit to the Birdman Sanctuary has been successfully booked
            </p>

            {/* Info Box */}
            <div className="bg-mist-white p-6 rounded-xl text-left space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-parakeet-green mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-deep-night mb-1">
                    Booking Details
                  </h3>
                  <p className="text-sm text-deep-night/70">
                    A confirmation SMS has been sent to your phone number with all the details.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-parakeet-green mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-deep-night mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-deep-night/70">
                    A detailed confirmation email with directions and guidelines has been sent to your email address.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-sunset-gold/10 border border-sunset-gold/20 p-4 rounded-lg mb-8 text-left">
              <h3 className="font-semibold text-deep-night mb-2">
                Important Reminders
              </h3>
              <ul className="text-sm text-deep-night/70 space-y-1 list-disc list-inside">
                <li>Please arrive 10 minutes before your scheduled time</li>
                <li>Bring a valid ID for verification</li>
                <li>Remember to follow sanctuary guidelines</li>
                <li>No outside food or drinks allowed</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/">
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/book">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Another Visit
                </Link>
              </Button>
            </div>
          </Card>

          {/* Contact Info */}
          <div className="mt-8 text-center text-sm text-deep-night/60">
            <p>
              Questions about your booking?{' '}
              <a
                href="tel:+919876543210"
                className="text-parakeet-green hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
