import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { Film, Bird, Heart, ArrowRight, ChevronRight, Quote, Star } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated-section';
import { Button } from '@/components/ui/button';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://birdmanofchennai.vercel.app';

export const metadata: Metadata = {
  title: 'Meiyazhagan & the Birdman of Chennai — The Real Story Behind the Film',
  description:
    "The Tamil film Meiyazhagan brought global attention to a real-life phenomenon: Sudarson Sah's rooftop parakeet sanctuary in Chintadripet. Discover the true story the film echoes and the man who lives it every day.",
  keywords: [
    'meiyazhagan birdman chennai',
    'meiyazhagan real story',
    'meiyazhagan inspiration',
    'meiyazhagan parakeets',
    'sudarson sah meiyazhagan',
    'meiyazhagan kili sudarson',
    'meiyazhagan film real life',
    'birdman of chennai meiyazhagan',
    'meiyazhagan chintadripet',
  ],
  alternates: {
    canonical: '/meiyazhagan',
    languages: { 'en-IN': '/meiyazhagan', 'ta-IN': '/ta/meiyazhagan' },
  },
  openGraph: {
    title: 'Meiyazhagan & the Birdman of Chennai — The Real Story',
    description:
      "Before Meiyazhagan captured hearts on screen, Sudarson Sah was living that story every day on a rooftop in Chintadripet. Meet the real Birdman of Chennai.",
    url: `${BASE_URL}/meiyazhagan`,
    images: [{ url: '/images/og-image.png', width: 1200, height: 1200 }],
  },
};

const parallels = [
  {
    filmTheme: 'A man with an extraordinary bond with birds',
    realLife: 'Sudarson Sah has spent 16+ years building an unbreakable bond with ~6,000 wild rose-ringed parakeets — feeding them twice daily, speaking to them by name, and earning their complete trust.',
    icon: '🦜',
  },
  {
    filmTheme: 'Devotion as a daily spiritual practice',
    realLife: 'Every single day — rain, heat, illness — Sudarson rises before dawn to prepare food. His relationship with the birds is not a hobby. It is, as he describes it, a calling.',
    icon: '🙏',
  },
  {
    filmTheme: 'A quiet life that touches thousands',
    realLife: 'A retired man on a pension, living modestly in a Chintadripet terrace house, has become a destination for visitors from 50+ countries. His story has been covered by BBC, National Geographic, and major Indian media.',
    icon: '🌍',
  },
  {
    filmTheme: 'Nature as a mirror for human connection',
    realLife: "The parakeets land on Sudarson's outstretched arms — a relationship so intimate that it defies the boundary between wild and tame. He says they sense his mood and comfort him on difficult days.",
    icon: '❤️',
  },
];

const mediaHighlights = [
  {
    outlet: 'BBC',
    quote: '"Every evening at dusk, thousands of parakeets descend on one man\'s Chennai rooftop — a daily spectacle that has drawn visitors from across the world."',
  },
  {
    outlet: 'National Geographic',
    quote: '"What Sudarson Sah has built is not a zoo or a sanctuary in the traditional sense. It is a covenant — between a man and the wild creatures who chose him."',
  },
  {
    outlet: 'The Hindu',
    quote: '"Kili Sudarson has spent his retirement savings feeding wild parakeets every day for over a decade. The birds come back not because they must, but because they want to."',
  },
];

export default function MeiyazhaganPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Meiyazhagan and the Real Birdman of Chennai: Sudarson Sah',
    description:
      "The Tamil film Meiyazhagan brought wider attention to the story of Sudarson Sah, the Birdman of Chennai, whose real-life devotion to feeding ~6,000 wild parakeets daily echoes the film's themes of human-nature connection.",
    url: `${BASE_URL}/meiyazhagan`,
    image: `${BASE_URL}/images/og-image.png`,
    author: {
      '@type': 'Person',
      name: 'Sudarson Sah',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Birdman of Chennai',
      url: BASE_URL,
    },
    about: {
      '@type': 'Movie',
      name: 'Meiyazhagan',
      description: 'Tamil language film that brought wider attention to themes of human-bird connection and urban wildlife in Chennai.',
    },
  };

  return (
    <>
      <Script
        id="meiyazhagan-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden bg-canopy-dark">
        <div className="absolute inset-0">
          <Image
            src="/images/gallery/sudarson-001.png"
            alt="Sudarson Sah — the real Birdman of Chennai — with parakeets on his rooftop sanctuary"
            fill
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-canopy-dark/70 via-canopy-dark/40 to-canopy-dark/85" />
        </div>
        <div className="container-wide relative z-10">
          <AnimatedSection>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 bg-golden-hour/20 text-golden-hour text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-golden-hour/30">
                <Film className="w-4 h-4" />
                Meiyazhagan & The Real Story
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
                Before the Film,
                <br />
                <span className="text-golden-hour">There Was the Man</span>
              </h1>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed">
                The Tamil film <em>Meiyazhagan</em> brought Chennai&apos;s extraordinary
                human-bird connection to global screens. But in Chintadripet, one man has
                been living that story — quietly, devotedly — for over 16 years.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── THE FILM ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-5xl mx-auto">
            <AnimatedSection direction="left">
              <span className="inline-block bg-golden-hour/10 text-golden-hour text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                The Film
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark mb-5">
                What is Meiyazhagan?
              </h2>
              <div className="space-y-4 text-canopy-dark/70 leading-relaxed">
                <p>
                  <em className="font-semibold text-canopy-dark">Meiyazhagan</em> is a Tamil
                  language film that explores themes of solitude, devotion, and the profound
                  relationships humans form with nature — particularly with birds. The film
                  resonated deeply with Tamil audiences precisely because it reflects a truth
                  they already know: such people exist in real life.
                </p>
                <p>
                  When the film was released, viewers immediately drew connections to
                  Chennai&apos;s own living legend — <strong className="text-canopy-dark">
                  Sudarson Sah</strong>, the man Chennaites call{' '}
                  <strong className="text-canopy-dark">Kili Sudarson</strong> (கிளி சுதர்சன்),
                  or simply &ldquo;The Birdman of Chennai.&rdquo;
                </p>
                <p>
                  The film brought thousands of new visitors to Chintadripet eager to see
                  the real version of the story — a man who doesn&apos;t need a screenplay
                  because his life is the script.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="bg-morning-mist rounded-3xl p-8 border border-sanctuary-green/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-golden-hour/10 rounded-xl flex items-center justify-center">
                    <Film className="w-5 h-5 text-golden-hour" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-canopy-dark">
                    Meiyazhagan
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Language', value: 'Tamil' },
                    { label: 'Themes', value: 'Human-nature bond, devotion, solitude' },
                    { label: 'Impact', value: 'Brought global attention to Chennai\'s parakeet sanctuary' },
                    { label: 'Real-Life Echo', value: 'Sudarson Sah, Chintadripet' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-start gap-4 py-3 border-b border-sanctuary-green/10 last:border-0"
                    >
                      <span className="text-sm font-medium text-canopy-dark/50 flex-shrink-0">
                        {item.label}
                      </span>
                      <span className="text-sm text-canopy-dark font-medium text-right">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── PARALLELS ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-morning-mist">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Film vs Reality
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
              Where Art Mirrors Life
            </h2>
            <p className="text-canopy-dark/60 mt-3 max-w-2xl mx-auto">
              The themes that made <em>Meiyazhagan</em> resonate so deeply exist, fully
              realised, on a rooftop in Chintadripet.
            </p>
          </AnimatedSection>

          <div className="space-y-6 max-w-4xl mx-auto">
            {parallels.map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card border border-sanctuary-green/10">
                  <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                    <div className="bg-golden-hour/5 rounded-xl p-4 border border-golden-hour/15">
                      <p className="text-xs font-bold text-golden-hour uppercase tracking-wide mb-2">
                        In Meiyazhagan
                      </p>
                      <p className="text-canopy-dark/75 text-sm leading-relaxed">
                        {item.filmTheme}
                      </p>
                    </div>

                    <div className="hidden md:flex flex-col items-center gap-2">
                      <div className="text-2xl">{item.icon}</div>
                      <ArrowRight className="w-5 h-5 text-sanctuary-green" />
                    </div>

                    <div className="bg-sanctuary-green/5 rounded-xl p-4 border border-sanctuary-green/15">
                      <p className="text-xs font-bold text-sanctuary-green uppercase tracking-wide mb-2">
                        In Real Life — Sudarson Sah
                      </p>
                      <p className="text-canopy-dark/75 text-sm leading-relaxed">
                        {item.realLife}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUDARSON'S STORY ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide max-w-4xl">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              The Real Story
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
              Sudarson Sah — Kili Sudarson
            </h2>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <AnimatedSection direction="left">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-hero">
                <Image
                  src="/images/gallery/sudarson-003.jpeg"
                  alt="Sudarson Sah — Kili Sudarson — the Birdman of Chennai feeding parakeets on his rooftop"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" className="space-y-5 text-canopy-dark/70 leading-relaxed">
              <p>
                In 2008, <strong className="text-canopy-dark">Mr. Sudarson Sah</strong> — a
                retired resident of Chintadripet, one of Chennai&apos;s oldest neighbourhoods —
                began leaving out rice for a few stray rose-ringed parakeets he noticed visiting
                his terrace. It was a small act of kindness, done for the simple joy of it.
              </p>
              <p>
                Within a few years, word spread through the parakeet population in ways no
                human could orchestrate. Hundreds became thousands. Today, every evening at
                4:30 PM, approximately <strong className="text-canopy-dark">6,000 wild
                parakeets</strong> descend on his rooftop — not because they are caged or
                trained, but because they choose to come.
              </p>
              <p>
                Sudarson spends a significant portion of his pension on rice, peanuts, and
                seed. He has never asked for payment and never turned a visitor away. He calls
                the birds his family. They, in turn, land on his arms and shoulders — a level
                of trust that takes years to earn from wild creatures.
              </p>
              <p>
                While Meiyazhagan tells a fictional story, Sudarson&apos;s story is entirely
                true — and has been documented by the BBC, National Geographic India, and
                dozens of international media outlets. His sanctuary has welcomed visitors
                from over 50 countries.
              </p>
              <div className="pt-2">
                <Link
                  href="/story"
                  className="inline-flex items-center gap-2 text-sanctuary-green font-semibold hover:gap-3 transition-all text-sm"
                >
                  Read the full story of Sudarson Sah
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── MEDIA HIGHLIGHTS ─────────────────────────────────────────────── */}
      <section className="py-20 bg-morning-mist">
        <div className="container-wide max-w-4xl">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              As Seen In
            </span>
            <h2 className="font-display text-3xl font-bold text-canopy-dark">
              The World Has Noticed
            </h2>
          </AnimatedSection>

          <StaggerContainer className="space-y-5">
            {mediaHighlights.map((item) => (
              <StaggerItem key={item.outlet}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card border border-sanctuary-green/10">
                  <div className="flex gap-4">
                    <Quote className="w-8 h-8 text-sanctuary-green/30 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-canopy-dark/75 italic leading-relaxed mb-3">
                        {item.quote}
                      </p>
                      <span className="text-xs font-bold text-sanctuary-green uppercase tracking-wider">
                        — {item.outlet}
                      </span>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-canopy-dark">
        <div className="container-wide text-center">
          <AnimatedSection className="space-y-6">
            <div className="flex justify-center mb-2">
              <Bird className="w-12 h-12 text-sanctuary-green-light" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Come See the Real Story
            </h2>
            <p className="text-white/70 max-w-xl mx-auto leading-relaxed">
              No screen can capture the sound of 6,000 wings, the warmth of Sudarson&apos;s
              welcome, or the feeling of watching the sky come alive every evening.
              That&apos;s something you have to experience in person.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button
                asChild
                size="lg"
                className="bg-sanctuary-green hover:bg-sanctuary-green-light text-white rounded-full px-8 gap-2 shadow-glow-green"
              >
                <Link href="/book">
                  Book a Free Visit
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-8"
              >
                <Link href="/visit">
                  Plan Your Visit
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  );
}
