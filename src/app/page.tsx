"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bird,
  Calendar,
  ChevronDown,
  Clock,
  Users,
  Star,
  ArrowRight,
  Heart,
  Camera,
  Leaf,
} from "lucide-react";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { Counter } from "@/components/ui/counter";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animated-section";

/* ════════════════════════════════════════════════════════════════════════════
   HOMEPAGE — Cinematic Landing Page
   ════════════════════════════════════════════════════════════════════════════ */

const stats = [
  {
    icon: Calendar,
    value: 16,
    suffix: "+",
    label: "Years of Dedication",
    color: "text-golden-hour",
  },
  {
    icon: Bird,
    value: 4000,
    suffix: "",
    label: "Daily Parakeets",
    color: "text-sanctuary-green",
  },
  {
    icon: Users,
    value: 14000,
    suffix: "+",
    label: "Happy Visitors",
    color: "text-sanctuary-green-light",
  },
  {
    icon: Clock,
    value: 1,
    suffix: "",
    label: "Session Daily",
    color: "text-sunset-amber",
  },
];

const galleryPreview = [
  { src: "/images/gallery/005.jpeg", alt: "Parakeets feeding on rooftop" },
  { src: "/images/gallery/006.jpeg", alt: "Flock of parakeets in flight" },
  { src: "/images/gallery/014.jpeg", alt: "Green parakeets gathering" },
];

const testimonials = [
  {
    name: "Priya Sundaram",
    rating: 5,
    text: "An absolutely magical experience! Watching thousands of parakeets arrive at feeding time is something I will never forget. Mr. Sah is truly an inspiration.",
    date: "March 2026",
  },
  {
    name: "Raj Krishnamurthy",
    rating: 5,
    text: "We visited during the evening session and it was breathtaking. The birds know him by heart. A must-visit for anyone in Chennai.",
    date: "February 2026",
  },
  {
    name: "Sarah Mitchell",
    rating: 5,
    text: "I traveled from London specifically to see this. It exceeded all expectations. The connection between Mr. Sah and these birds is truly extraordinary.",
    date: "January 2026",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/banner_hd.png"
            alt="Parakeet soaring over Chennai rooftop at golden hour"
            fill
            priority
            className="hidden sm:block object-cover"
            sizes="100vw"
          />
          <Image
            src="/images/mobile_banner.png"
            alt="Parakeet soaring over Chennai rooftop at golden hour"
            fill
            priority
            className="block sm:hidden object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-hero-overlay" />
        </div>

        {/* Floating feathers */}
        <FloatingParticles count={10} />

        {/* Content */}
        <div className="relative z-10 container-wide text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Bird className="w-4 h-4" />
              Chennai&apos;s Urban Bird Sanctuary
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display font-black text-white text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight drop-shadow-xl mb-4"
          >
            The Birdman
            <br />
            <span className="text-golden-hour">of Chennai</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="font-tamil text-white/80 text-xl md:text-2xl mb-2 drop-shadow-lg"
          >
            சென்னையின் பறவை மனிதர்
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Where 4,000 wild parakeets come home every day
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-golden-hour hover:bg-sunset-amber text-canopy-dark font-semibold px-8 py-3.5 rounded-full transition-all duration-300 hover:shadow-glow-gold text-base"
            >
              <Calendar className="w-5 h-5" />
              Book Your Visit
            </Link>
            <Link
              href="/story"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium px-7 py-3.5 rounded-full transition-all duration-300 text-base border border-white/20"
            >
              Read His Story
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-7 h-7 text-white/50" />
        </motion.div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 z-20 pb-8">
        <div className="container-wide">
          <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, i) => (
                <AnimatedSection
                  key={stat.label}
                  delay={i * 0.1}
                  className="text-center"
                >
                  <stat.icon className={`w-7 h-7 ${stat.color} mx-auto mb-2`} />
                  <div className="font-display font-bold text-2xl md:text-3xl text-canopy-dark">
                    <Counter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-canopy-dark/50 mt-1">
                    {stat.label}
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STORY TEASER ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection direction="left">
              <div className="relative">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-hero">
                  <Image
                    src="/images/gallery/sudarson-001.png"
                    alt="Mr. Sudarson Sah — The Birdman of Chennai, depicted with parakeets and divine inspiration"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                {/* Decorative badge */}
                <div className="absolute -bottom-4 -right-4 md:right-8 bg-sunset-amber text-white px-5 py-2.5 rounded-full font-display font-bold text-sm shadow-lg flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-current" />
                  16+ Years of Love
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" className="space-y-6">
              <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full">
                The Story
              </span>

              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark leading-tight">
                A Man Who Became{" "}
                <span className="text-gradient-green">a Sanctuary</span>
              </h2>

              <div className="space-y-4 text-canopy-dark/70 text-base md:text-lg leading-relaxed">
                <p>
                  For over 16 years, Mr. Sudarson Sah has opened his rooftop in
                  Chintadripet, Chennai, to thousands of wild parakeets. What
                  began as feeding a handful of birds with rice has blossomed
                  into an extraordinary daily gathering of up to{" "}
                  <strong className="text-canopy-dark">4,000 parakeets</strong>.
                </p>
                <p>
                  Every morning at dawn and every evening at dusk, the sky turns
                  green as waves of parakeets descend upon his home — a
                  testament to patience, unconditional love, and an unbreakable
                  bond with nature.
                </p>
              </div>

              <Link
                href="/story"
                className="inline-flex items-center gap-2 text-sanctuary-green hover:text-canopy-dark font-semibold transition-colors group"
              >
                Read the full story
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── GALLERY PREVIEW ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-morning-mist">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Gallery
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark">
              The Sanctuary in Pictures
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-3 gap-5">
            {galleryPreview.map((img, i) => (
              <StaggerItem key={img.src}>
                <Link href="/gallery" className="block group">
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-card">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-canopy-dark/0 group-hover:bg-canopy-dark/30 transition-colors duration-500 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center mt-10">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 bg-canopy-dark hover:bg-night-sky text-white font-medium px-7 py-3 rounded-full transition-all duration-300"
            >
              View Full Gallery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ── VISIT INFO ───────────────────────────────────────────────────── */}
      <section className="py-14 md:py-16 bg-white">
        <div className="container-wide">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Best Season */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-start gap-5 bg-amber-50 border border-golden-hour/20 rounded-2xl p-6">
                <div className="w-12 h-12 bg-golden-hour/15 rounded-xl flex items-center justify-center shrink-0">
                  <Leaf className="w-6 h-6 text-golden-hour" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-golden-hour/80 uppercase tracking-wider mb-1">
                    Best Time to Visit
                  </p>
                  <h3 className="font-display font-bold text-xl text-canopy-dark mb-1.5">
                    November &ndash; March
                  </h3>
                  <p className="text-sm text-canopy-dark/60 leading-relaxed">
                    The cooler months bring the largest flocks. Witness up to
                    4,000 parakeets gathering in perfect Chennai weather.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Food Donations */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-start gap-5 bg-sanctuary-green/5 border border-sanctuary-green/20 rounded-2xl p-6">
                <div className="w-12 h-12 bg-sanctuary-green/15 rounded-xl flex items-center justify-center shrink-0">
                  <Bird className="w-6 h-6 text-sanctuary-green" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sanctuary-green/80 uppercase tracking-wider mb-1">
                    Support the Sanctuary
                  </p>
                  <h3 className="font-display font-bold text-xl text-canopy-dark mb-1.5">
                    Food Donations Welcome
                  </h3>
                  <p className="text-sm text-canopy-dark/60 leading-relaxed">
                    Visitors may bring{" "}
                    <strong className="text-canopy-dark">
                      raw peanuts (0.5&ndash;1 kg)
                    </strong>{" "}
                    to donate &mdash; the parakeets&apos; favourite treat
                    alongside Mr. Sah&apos;s daily feed.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-golden-hour/10 text-sunset-amber text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Visitor Reviews
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark">
              What Visitors Say
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {testimonials.map((review) => (
              <StaggerItem key={review.name}>
                <div className="bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-golden-hour fill-golden-hour"
                      />
                    ))}
                  </div>

                  <p className="text-canopy-dark/70 text-sm leading-relaxed flex-1 mb-4">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-canopy-dark/5">
                    <div className="w-9 h-9 bg-sanctuary-green/10 text-sanctuary-green rounded-full flex items-center justify-center text-sm font-semibold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-canopy-dark">
                        {review.name}
                      </div>
                      <div className="text-xs text-canopy-dark/40">
                        {review.date}
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center mt-10">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-2 text-sanctuary-green hover:text-canopy-dark font-semibold transition-colors group"
            >
              See all reviews
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  );
}
