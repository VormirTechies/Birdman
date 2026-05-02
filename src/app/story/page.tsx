'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bird,
  Calendar,
  Heart,
  Sunrise,
  Sunset,
  Users,
  Award,
  Film,
  ArrowRight,
  Clock,
  Leaf,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Counter } from '@/components/ui/counter';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated-section';

/* ════════════════════════════════════════════════════════════════════════════
   STORY PAGE — The Birdman's Journey
   ════════════════════════════════════════════════════════════════════════════ */

const timeline = [
  {
    year: '2008',
    title: 'A Simple Act of Kindness',
    description:
      'Mr. Sudarson Sah begins feeding a few stray parakeets on his rooftop in Chintadripet with leftover rice. Just a handful of birds visit each day.',
    icon: Leaf,
  },
  {
    year: '2012',
    title: 'Word Spreads Among Birds',
    description:
      'The number of visiting parakeets grows to hundreds. Sudarson starts spending his own pension money on rice and peanuts to feed them twice daily.',
    icon: Bird,
  },
  {
    year: '2016',
    title: 'Thousands Arrive Daily',
    description:
      'Over 5,000 parakeets now visit the rooftop. Local media takes notice. Sudarson builds wooden feeding platforms across his entire rooftop.',
    icon: Users,
  },
  {
    year: '2020',
    title: 'Internet Fame',
    description:
      'Videos of the parakeet gathering go viral on social media, attracting visitors from around the world. International media covers the story.',
    icon: Award,
  },
  {
    year: '2024',
    title: 'The Meiyazhagan Connection',
    description:
      'The Tamil movie "Meiyazhagan" brings wider attention to bird conservation in Chennai. Sudarson\'s sanctuary becomes a symbol of human-nature harmony.',
    icon: Film,
  },
  {
    year: 'Today',
    title: '4,000 Daily Visitors',
    description:
      'Up to 4,000 wild parakeets gather every evening. The sanctuary has become Chennai\'s most unique urban wildlife experience.',
    icon: Heart,
  },
];

const dailyRoutine = [
  {
    time: '5:30 AM',
    title: 'Preparation',
    description:
      'Sudarson wakes before dawn to prepare the feeding platforms — laying out rice, peanuts, and bird seed across wooden planks on the rooftop.',
    icon: Clock,
  },
  {
    time: '6:00 AM',
    title: 'Morning Feeding',
    description:
      'The first wave of parakeets arrives with the sunrise. Within minutes, thousands fill the sky, their green wings catching the golden morning light.',
    icon: Sunrise,
  },
  {
    time: '4:30 PM',
    title: 'Evening Gathering',
    description:
      'As the sun begins to set, the parakeets return for their evening meal. This is the exclusive visiting window where visitors can witness the magic firsthand.',
    icon: Sunset,
  },
];

export default function StoryPage() {
  return (
    <>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative h-[50vh] md:h-[60vh] min-h-[400px]">
          <Image
            src="/images/gallery/sudarson-002.jpeg"
            alt="Mr. Sudarson Sah with parakeets"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-canopy-dark/70 via-canopy-dark/40 to-feather-cream" />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center max-w-3xl px-4"
            >
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                <Heart className="w-4 h-4 fill-current" />
                A Story of Love & Dedication
              </span>
              <h1 className="font-display font-black text-white text-4xl md:text-5xl lg:text-6xl leading-tight drop-shadow-xl">
                The Man Behind{' '}
                <span className="text-golden-hour">the Miracle</span>
              </h1>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── INTRODUCTION ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection direction="left">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-hero">
                <Image
                  src="/images/gallery/sudarson-003.jpeg"
                  alt="Sudarson Sah"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" className="space-y-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
                Who is the Birdman?
              </h2>
              <div className="space-y-4 text-canopy-dark/70 text-base md:text-lg leading-relaxed">
                <p>
                  <strong className="text-canopy-dark">Mr. Sudarson Sah</strong>{' '}
                  is a retired man living in a modest home in Chintadripet,
                  one of Chennai&apos;s oldest neighborhoods. What makes him
                  extraordinary isn&apos;t wealth or fame — it&apos;s his
                  unwavering commitment to feeding and protecting wild parakeets.
                </p>
                <p>
                  Every single day for 16+ years, rain or shine, he has risen
                  before dawn to prepare food for the birds. He spends a
                  significant portion of his pension on rice, peanuts, and bird
                  seed — not out of obligation, but out of pure love.
                </p>
                <p>
                  The parakeets, in return, have made his rooftop their home.
                  They trust him completely — landing on his arms, shoulders,
                  and head as he moves among them. It&apos;s a bond that defies
                  the boundaries between humans and wild creatures.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-morning-mist">
        <div className="container-wide max-w-4xl">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Timeline
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark">
              A Journey of Love
            </h2>
          </AnimatedSection>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-sanctuary-green/20 md:-translate-x-px" />

            <div className="space-y-12 md:space-y-16">
              {timeline.map((event, i) => (
                <AnimatedSection
                  key={event.year}
                  delay={i * 0.1}
                  direction={i % 2 === 0 ? 'left' : 'right'}
                  className={`relative flex flex-col md:flex-row items-start gap-6 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`ml-20 md:ml-0 md:w-[calc(50%-2rem)] ${
                      i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'
                    }`}
                  >
                    <span className="text-sanctuary-green font-display font-bold text-xl">
                      {event.year}
                    </span>
                    <h3 className="font-display font-bold text-xl text-canopy-dark mt-1 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-canopy-dark/60 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Circle indicator */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 bg-sanctuary-green rounded-full flex items-center justify-center shadow-glow-green">
                    <event.icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PEOPLE ───────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Meet the Team
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark">
              The People Behind the Sanctuary
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 gap-8">
            {/* Sudarson Sah */}
            <StaggerItem>
              <div className="bg-white rounded-3xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
                <div className="relative aspect-4/3">
                  <Image
                    src="/images/gallery/sudarson-001.png"
                    alt="Sudarson Sah — The Birdman of Chennai"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-canopy-dark/60 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <span className="inline-block bg-golden-hour text-canopy-dark text-xs font-bold px-3 py-1 rounded-full">
                      Founder
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-2xl text-canopy-dark mb-1">
                    Sudarson Sah
                  </h3>
                  <p className="text-sanctuary-green font-medium text-sm mb-3">
                    The Birdman of Chennai
                  </p>
                  <p className="text-canopy-dark/60 text-sm leading-relaxed">
                    A retired man who turned his rooftop into a haven for thousands of wild
                    parakeets. For 16+ years, he has risen every morning before dawn — rain
                    or shine — spending his own pension to feed the birds. A living legend
                    of compassion and an unbreakable bond between man and nature.
                  </p>
                </div>
              </div>
            </StaggerItem>

            {/* Vidhya Aunty */}
            <StaggerItem>
              <div className="bg-white rounded-3xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
                <div className="relative aspect-4/3 bg-sanctuary-green/8 flex items-center justify-center">
                  <div className="w-28 h-28 bg-sanctuary-green/20 rounded-full flex items-center justify-center">
                    <Users className="w-14 h-14 text-sanctuary-green/50" />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-canopy-dark/60 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <span className="inline-block bg-golden-hour text-white text-xs font-bold px-3 py-1 rounded-full">
                      Wife
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-2xl text-canopy-dark mb-1">
                    Vidhya
                  </h3>
                  <p className="text-golden-hour font-medium text-sm mb-3">
                    Sudarson&apos;s Beloved Partner
                  </p>
                  <p className="text-canopy-dark/60 text-sm leading-relaxed">
                    The quiet force who shows up every single day to help Sudarson prepare
                    the feed and lay out the platforms. She also ensures every visitor feels
                    genuinely welcomed — and leaves with a memory they will treasure for life.
                  </p>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ── VOLUNTEERS ───────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-morning-mist">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Community
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark">
              Powered by Volunteers
            </h2>
            <p className="text-canopy-dark/60 text-base md:text-lg mt-4 max-w-xl mx-auto">
              This sanctuary runs on the goodwill of people who give their time and heart freely.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { initials: 'VN', name: 'Volunteer Name', role: 'Daily Feeding Support', bg: '#C8E6C9', text: '#2E7D32' },
              { initials: 'VN', name: 'Volunteer Name', role: 'Visitor Coordination', bg: '#FFE0B2', text: '#E65100' },
              { initials: 'VN', name: 'Volunteer Name', role: 'Sanctuary Upkeep', bg: '#BBDEFB', text: '#1976D2' },
              { initials: 'VN', name: 'Volunteer Name', role: 'Community Outreach', bg: '#E1BEE7', text: '#7B1FA2' },
            ].map((v, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-2xl shadow-card p-6 text-center hover:shadow-card-hover transition-shadow duration-300">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-display font-bold"
                    style={{ backgroundColor: v.bg, color: v.text }}
                  >
                    {v.initials}
                  </div>
                  <h4 className="font-display font-bold text-canopy-dark text-base">{v.name}</h4>
                  <p className="text-sanctuary-green text-xs font-semibold mt-1 mb-2">{v.role}</p>
                  <p className="text-canopy-dark/50 text-xs leading-relaxed">
                    Placeholder — real name coming soon
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center">
            <p className="text-canopy-dark/50 text-sm">
              Want to volunteer?{' '}
              <a
                href="mailto:sudarsonsah@gmail.com"
                className="text-sanctuary-green font-medium hover:underline"
              >
                Reach out to Sudarson
              </a>
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── DAILY ROUTINE ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-golden-hour/10 text-sunset-amber text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Daily Schedule
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-canopy-dark">
              A Day at the Sanctuary
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {dailyRoutine.map((item) => (
              <StaggerItem key={item.time}>
                <div className="bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 text-center h-full group">
                  <div className="w-16 h-16 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-sanctuary-green/20 transition-colors">
                    <item.icon className="w-7 h-7 text-sanctuary-green" />
                  </div>
                  <div className="text-golden-hour font-display font-bold text-lg mb-1">
                    {item.time}
                  </div>
                  <h3 className="font-display font-bold text-xl text-canopy-dark mb-3">
                    {item.title}
                  </h3>
                  <p className="text-canopy-dark/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-nature-gradient text-white">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              By the Numbers
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 4000, label: 'Parakeets Daily', suffix: '' },
              { value: 16, label: 'Years of Service', suffix: '+' },
              { value: 40, label: 'Kg Rice Daily', suffix: '' },
              { value: 14000, label: 'Visitors Served', suffix: '+' },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.1} className="text-center">
                <div className="font-display font-bold text-3xl md:text-4xl text-white">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/60 text-sm mt-2">{stat.label}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO COLLAGE ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
              Captured Moments
            </h2>
          </AnimatedSection>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {[
              { src: '/images/gallery/001.jpeg', alt: 'Parakeet preparing for landing', span: '' },
              { src: '/images/gallery/003.jpeg', alt: 'Birds gathering at golden hour', span: 'md:col-span-2' },
              { src: '/images/gallery/007.jpeg', alt: 'Parakeets on feeding platform', span: '' },
              { src: '/images/gallery/008.jpeg', alt: 'Close-up of rose-ringed parakeet', span: '' },
              { src: '/images/gallery/010.jpeg', alt: 'Sudarson with his birds', span: '' },
              { src: '/images/gallery/012.jpeg', alt: 'Parakeets in the sanctuary', span: '' },
            ].map((img) => (
              <StaggerItem key={img.src} className={img.span}>
                <Link href="/gallery" className="block relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card group">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <AnimatedSection>
        <section className="py-20 md:py-24 bg-morning-mist text-center">
          <div className="container-wide max-w-2xl">
            <Bird className="w-10 h-10 text-sanctuary-green mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark mb-4">
              Come See for Yourself
            </h2>
            <p className="text-canopy-dark/60 text-lg mb-8">
              No video or photo can capture the sheer wonder of 4,000 birds
              arriving at once. You have to be there.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-sanctuary-green hover:bg-canopy-dark text-white font-semibold px-8 py-3.5 rounded-full text-base transition-all duration-300 hover:shadow-glow-green"
            >
              <Calendar className="w-5 h-5" />
              Book Your Visit
            </Link>
          </div>
        </section>
      </AnimatedSection>

      <Footer />
    </>
  );
}
