import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { HeroSection } from '@/components/organisms/HeroSection';
import { AboutSection } from '@/components/organisms/AboutSection';
import { GallerySection } from '@/components/organisms/GallerySection';
import { FeedbackSection } from '@/components/organisms/FeedbackSection';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <GallerySection />
        <FeedbackSection />
      </main>
      <Footer />
    </>
  );
}

