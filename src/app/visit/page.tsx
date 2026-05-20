import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  MapPin, Clock, Calendar, Bus, Train, Car, Bike,
  Camera, Star, ChevronRight, Ticket, Sun, Users,
} from 'lucide-react';
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
  title: 'Visit the Birdman of Chennai — Timings, Address & How to Get There',
  description:
    'Complete visitor guide for the Birdman of Chennai parakeet sanctuary in Chintadripet. Visiting hours 4:30–6:00 PM daily, free entry, directions by metro/bus/auto, photography tips, and FAQ.',
  keywords: [
    'visit birdman chennai',
    'birdman of chennai address',
    'birdman of chennai timings',
    'parakeet sanctuary chennai visiting hours',
    'how to reach birdman of chennai',
    'chintadripet parakeet feeding',
    'rose ringed parakeet sanctuary chennai',
    'kili sudarson chennai',
    'chennai birdwatching attraction',
    'iyya mudali street parakeets',
  ],
  alternates: {
    canonical: '/visit',
    languages: { 'en-IN': '/visit', 'ta-IN': '/ta/visit' },
  },
  openGraph: {
    title: 'Visit the Birdman of Chennai — Timings, Address & Directions',
    description:
      "Every evening at 4:30 PM, ~6,000 wild rose-ringed parakeets descend on a rooftop in Chintadripet, Chennai. Free entry. Here's everything you need to plan a perfect visit.",
    url: `${BASE_URL}/visit`,
    images: [{ url: '/images/og-image.png', width: 1200, height: 1200 }],
  },
};

const faqs = [
  {
    question: 'What time do the parakeets arrive?',
    answer:
      'The evening gathering begins around 4:30 PM and lasts until approximately 6:00 PM. This is the only publicly accessible window to witness the spectacle. Sudarson also feeds the birds at dawn (around 6:00 AM) but that session is private.',
  },
  {
    question: 'Is entry free? Is booking required?',
    answer:
      'Entry is completely free. However, advance booking is strongly recommended as daily visitor capacity is limited to ensure everyone has an intimate experience with the birds.',
  },
  {
    question: 'What is the exact address?',
    answer:
      "The sanctuary is at Iyya Mudali Street, Chintadripet, Chennai — 600002. Search for 'Birdman of Chennai' or 'Kili Sudarson' on Google Maps. From Chintadripet Metro Station, it's a 10-minute walk north.",
  },
  {
    question: 'How long does the visit take?',
    answer:
      'Plan for 60–90 minutes. The parakeet gathering peak lasts around 45 minutes, and the rooftop orientation takes about 15 minutes. Most visitors happily stay the full 90 minutes for the golden-hour light.',
  },
  {
    question: 'What should I bring?',
    answer:
      'Bring a camera or smartphone (zoom helps), wear comfortable footwear for stairs, and consider a light hat. Do not bring food for the birds — Sudarson has a carefully planned diet for them.',
  },
  {
    question: 'Is the visit suitable for children?',
    answer:
      'Absolutely. Children find it magical. The stairs are narrow, so carry very young children. The experience is genuinely awe-inspiring — many families make it an annual tradition.',
  },
  {
    question: 'What happens if it rains?',
    answer:
      'Light rain rarely stops the parakeets. Heavy rain may reduce numbers slightly. The rooftop has partial shade. During monsoon (June–September), come prepared with a light raincoat.',
  },
  {
    question: 'Can I visit without a booking?',
    answer:
      'Walk-ins are sometimes possible but not guaranteed. Daily capacity is limited to protect the birds from overcrowding and ensure quality for all visitors. Booking in advance is highly recommended, especially on weekends.',
  },
];

const transportModes = [
  {
    icon: Train,
    mode: 'Metro (Recommended)',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    steps: [
      'Take Chennai Metro Green Line to Chintadripet Station',
      'Exit and walk 10 minutes north along Peters Road',
      'Turn right onto Iyya Mudali Street',
      "Look for the rooftop with birds — you'll hear them before you see them",
    ],
    duration: '~10 min walk from station',
  },
  {
    icon: Bus,
    mode: 'By Bus (MTC)',
    color: 'bg-green-50 text-sanctuary-green border-sanctuary-green/20',
    iconColor: 'text-sanctuary-green',
    steps: [
      'MTC buses 5, 11, 15C, or 18D stop at Chintadripet',
      'Alight at Peters Road / Chintadripet Bus Stop',
      'Walk 8–12 minutes to Iyya Mudali Street',
      "Ask locals for 'Kili Sudarson' — everyone in the area knows him",
    ],
    duration: '8–12 min walk from bus stop',
  },
  {
    icon: Car,
    mode: 'By Car / Cab',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    steps: [
      "Search 'Birdman of Chennai' or 'Kili Sudarson' on Google Maps",
      'Street parking available on Peters Road',
      'The lane is narrow — autos can enter; larger cars park on Peters Road',
      'Ola/Uber: drop at Chintadripet Metro, then walk 10 minutes',
    ],
    duration: '~5 min walk from Peters Road',
  },
  {
    icon: Bike,
    mode: 'Two-Wheeler',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    steps: [
      'Park at the junction of Peters Road and Iyya Mudali Street',
      'The lane is accessible but narrow — park at the entrance',
      'No parking inside the lane immediately in front of the house',
    ],
    duration: 'Park at lane entrance',
  },
];

const photographyTips = [
  {
    title: 'Best Position',
    tip: 'Face west on the rooftop for golden-hour backlight. Birds approach from multiple directions — the north-facing angle often shows the densest flocks.',
  },
  {
    title: 'Camera Settings',
    tip: 'Burst mode, shutter speed 1/800s or faster, ISO 400–800. The birds move fast — continuous autofocus (AI servo / tracking) is essential.',
  },
  {
    title: 'Zoom Range',
    tip: '70–200mm equivalent captures individual birds beautifully. A wide 24mm shot with the sky filled with thousands of birds is equally spectacular.',
  },
  {
    title: 'Golden Hour Magic',
    tip: "The 20-minute window just before sunset (around 5:45 PM) turns the birds' brilliant green feathers gold. This is the shot you came for.",
  },
  {
    title: 'Video Mode',
    tip: '4K 30fps video — the sound of 6,000 wings beating is as spectacular as the sight. Switch between photo and video throughout.',
  },
  {
    title: 'Respect the Birds',
    tip: 'No flash photography. Sudden loud noises scatter the flock. Slow movements, soft voices, and patience yield the best results.',
  },
];

export default function VisitPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const touristAttractionSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: 'Birdman of Chennai — Parakeet Sanctuary',
    description:
      "Daily gathering of ~6,000 wild rose-ringed parakeets at Sudarson Sah's rooftop sanctuary in Chintadripet, Chennai.",
    url: `${BASE_URL}/visit`,
    image: `${BASE_URL}/images/og-image.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Iyya Mudali Street',
      addressLocality: 'Chintadripet',
      addressRegion: 'Tamil Nadu',
      postalCode: '600002',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '13.0750',
      longitude: '80.2647',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '16:30',
      closes: '18:00',
    },
    isAccessibleForFree: true,
    touristType: ['Nature Lovers', 'Bird Watchers', 'Families', 'Photographers'],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Visit the Birdman of Chennai',
    description:
      'Step-by-step guide to visiting the parakeet sanctuary in Chintadripet, Chennai.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Book your slot in advance',
        text: 'Book a free visit slot online to guarantee your place — daily capacity is limited.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Travel to Chintadripet',
        text: 'Take the Chennai Metro (Green Line) to Chintadripet Station. Arrive by 4:15 PM.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Find the sanctuary',
        text: "Walk 10 minutes north from the station to Iyya Mudali Street. Ask locals for 'Kili Sudarson'.",
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Ascend to the rooftop',
        text: "Climb the stairs to Sudarson Sah's rooftop. He will personally welcome you.",
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Witness the gathering',
        text: 'From 4:30 PM, ~6,000 wild rose-ringed parakeets begin arriving. Watch, listen, and photograph the daily miracle.',
      },
    ],
  };

  return (
    <>
      <Script
        id="visit-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, touristAttractionSchema, howToSchema]),
        }}
      />
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[55vh] flex items-end pb-16 pt-32 overflow-hidden bg-canopy-dark">
        <div className="absolute inset-0">
          <Image
            src="/images/gallery/002.jpeg"
            alt="Thousands of rose-ringed parakeets filling the sky above the Birdman of Chennai sanctuary at sunset"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-canopy-dark/60 via-canopy-dark/30 to-canopy-dark/80" />
        </div>
        <div className="container-wide relative z-10">
          <AnimatedSection>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 bg-sanctuary-green/20 text-sanctuary-green-light text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-sanctuary-green/30">
                <MapPin className="w-4 h-4" />
                Chintadripet, Chennai — 600002
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
                Plan Your Visit to the
                <br />
                <span className="text-sanctuary-green-light">Birdman of Chennai</span>
              </h1>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed">
                Every evening at 4:30 PM, ~6,000 wild rose-ringed parakeets descend on one
                rooftop in Chintadripet. Here&apos;s everything you need to plan a perfect visit.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── QUICK INFO CARDS ─────────────────────────────────────────────── */}
      <section className="py-10 bg-feather-cream border-b border-sanctuary-green/10">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: 'Visit Window', value: '4:30 – 6:00 PM', sub: 'Daily, year-round' },
              { icon: Ticket, label: 'Entry Fee', value: 'Free', sub: 'Advance booking required' },
              { icon: MapPin, label: 'Location', value: 'Chintadripet', sub: 'Chennai – 600002' },
              { icon: Users, label: 'Duration', value: '60–90 min', sub: 'Peak 45 min' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-5 shadow-card border border-sanctuary-green/10 text-center"
              >
                <div className="w-10 h-10 bg-morning-mist rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-sanctuary-green" />
                </div>
                <p className="text-xs text-canopy-dark/50 font-medium uppercase tracking-wide mb-1">
                  {label}
                </p>
                <p className="font-display font-bold text-canopy-dark text-lg leading-tight">
                  {value}
                </p>
                <p className="text-xs text-canopy-dark/50 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GETTING THERE ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Directions
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
              How to Get There
            </h2>
            <p className="text-canopy-dark/60 mt-3 max-w-xl mx-auto">
              Chintadripet is central Chennai — well connected by metro, bus, and auto-rickshaw.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {transportModes.map((transport, i) => (
              <AnimatedSection key={transport.mode} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 shadow-card border border-sanctuary-green/10 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${transport.color}`}
                    >
                      <transport.icon className={`w-5 h-5 ${transport.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-canopy-dark">{transport.mode}</h3>
                      <p className="text-xs text-canopy-dark/50">{transport.duration}</p>
                    </div>
                  </div>
                  <ol className="space-y-2.5">
                    {transport.steps.map((step, j) => (
                      <li key={j} className="flex gap-3 text-sm text-canopy-dark/70">
                        <span className="flex-shrink-0 w-5 h-5 bg-morning-mist text-sanctuary-green rounded-full flex items-center justify-center text-xs font-bold">
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Map */}
          <AnimatedSection>
            <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-sanctuary-green/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.1905!2d80.26246!3d13.07305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267b9df1e24eb%3A0xef6a4ed4fb0bba9b!2sChintadripet%2C%20Chennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1716000000000!5m2!1sen!2sin"
                width="100%"
                height="360"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Birdman of Chennai — Iyya Mudali Street, Chintadripet, Chennai location map"
                className="w-full"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── WHAT TO EXPECT ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-morning-mist">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              The Experience
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
              What to Expect
            </h2>
          </AnimatedSection>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                time: '4:00 PM',
                emoji: '🚶',
                title: 'Arrive Early',
                desc: "Reach the sanctuary by 4:00–4:15 PM. This gives you time to settle on the rooftop, meet Sudarson, and pick a good vantage point before the birds start arriving. The rooftop holds a limited number of visitors — early arrival guarantees a prime spot.",
              },
              {
                time: '4:30 PM',
                emoji: '🦜',
                title: 'The Gathering Begins',
                desc: "Right on schedule — as if by magic — the first flocks appear on the horizon. Within 20 minutes, the sky fills with thousands of rose-ringed parakeets, their wingbeats creating a sound like rushing water. They land on Sudarson's arms, shoulders, and the feeding platforms he's built across the rooftop.",
              },
              {
                time: '5:45 PM',
                emoji: '🌅',
                title: 'Golden Hour',
                desc: "As the sun approaches the horizon, the parakeets' brilliant green feathers turn gold. The contrast against Chennai's pink-orange sky is breathtaking. Most visitors agree this 20-minute window is the most beautiful thing they've witnessed in any city.",
              },
            ].map((item) => (
              <AnimatedSection key={item.time}>
                <div className="text-center px-2">
                  <div className="text-5xl mb-4">{item.emoji}</div>
                  <div className="inline-block bg-sanctuary-green text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {item.time}
                  </div>
                  <h3 className="font-display font-bold text-xl text-canopy-dark mb-3">
                    {item.title}
                  </h3>
                  <p className="text-canopy-dark/65 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTOGRAPHY TIPS ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <AnimatedSection direction="left">
              <span className="inline-block bg-golden-hour/10 text-golden-hour text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                Photography Guide
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark mb-4">
                Capturing the Moment
              </h2>
              <p className="text-canopy-dark/65 text-lg mb-8 leading-relaxed">
                The parakeet gathering is one of the most photogenic wildlife spectacles in any
                Indian city. These tips will help you come home with extraordinary shots.
              </p>
              <div className="space-y-4">
                {photographyTips.map((tip) => (
                  <div key={tip.title} className="flex gap-4">
                    <Camera className="w-4 h-4 text-golden-hour mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-canopy-dark text-sm">{tip.title}: </span>
                      <span className="text-canopy-dark/65 text-sm">{tip.tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-hero">
                <Image
                  src="/images/gallery/004.jpeg"
                  alt="Parakeets in golden hour light at the Birdman of Chennai sanctuary — photography guide"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── BEST TIME TO VISIT ───────────────────────────────────────────── */}
      <section className="py-16 bg-morning-mist">
        <div className="container-wide max-w-4xl">
          <AnimatedSection>
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-card border border-sanctuary-green/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-golden-hour/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sun className="w-6 h-6 text-golden-hour" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-canopy-dark mb-3">
                    Best Time to Visit
                  </h2>
                  <p className="text-canopy-dark/70 leading-relaxed mb-4">
                    The sanctuary is open <strong className="text-canopy-dark">365 days a year</strong>,
                    rain or shine. The parakeets come every single day — it&apos;s their home.
                    That said, some seasons offer distinct advantages:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    {[
                      {
                        season: 'Oct – Feb',
                        label: 'Peak Season',
                        desc: 'Cool, clear evenings. Best photography light. Largest flocks. Highly recommended.',
                        tag: 'Best',
                        tagColor: 'bg-sanctuary-green text-white',
                      },
                      {
                        season: 'Mar – May',
                        label: 'Summer',
                        desc: 'Hot afternoons but beautiful red-sky sunsets. Arrive hydrated. Still spectacular.',
                        tag: 'Great',
                        tagColor: 'bg-golden-hour text-white',
                      },
                      {
                        season: 'Jun – Sep',
                        label: 'Monsoon',
                        desc: 'Light rain rarely stops the birds. Heavy rain may thin the flock. Bring a raincoat.',
                        tag: 'Possible',
                        tagColor: 'bg-blue-500 text-white',
                      },
                    ].map((s) => (
                      <div
                        key={s.season}
                        className="bg-feather-cream rounded-2xl p-4 border border-sanctuary-green/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-canopy-dark text-sm">{s.season}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.tagColor}`}>
                            {s.tag}
                          </span>
                        </div>
                        <p className="text-xs text-canopy-dark/60 leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-feather-cream">
        <div className="container-wide max-w-3xl">
          <AnimatedSection className="text-center mb-14">
            <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              FAQ
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark">
              Visitor Questions
            </h2>
            <p className="text-canopy-dark/60 mt-3">
              Everything you need to know before you come.
            </p>
          </AnimatedSection>

          <StaggerContainer className="space-y-3">
            {faqs.map((faq, i) => (
              <StaggerItem key={i}>
                <details className="group bg-white rounded-2xl border border-sanctuary-green/10 shadow-card overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none font-semibold text-canopy-dark hover:text-sanctuary-green transition-colors text-sm md:text-base">
                    {faq.question}
                    <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-open:rotate-90 text-sanctuary-green" />
                  </summary>
                  <div className="px-6 pb-6 text-canopy-dark/65 text-sm leading-relaxed border-t border-sanctuary-green/10 pt-4">
                    {faq.answer}
                  </div>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-canopy-dark">
        <div className="container-wide text-center">
          <AnimatedSection className="space-y-6">
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-golden-hour text-golden-hour" />
              ))}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Ready to Witness the Magic?
            </h2>
            <p className="text-white/70 max-w-xl mx-auto leading-relaxed">
              Book your free visit slot now. Slots are limited each day to ensure everyone
              has an intimate, unhurried experience with the birds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button
                asChild
                size="lg"
                className="bg-sanctuary-green hover:bg-sanctuary-green-light text-white rounded-full px-8 gap-2 shadow-glow-green"
              >
                <Link href="/book">
                  <Calendar className="w-5 h-5" />
                  Book a Free Visit
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-8"
              >
                <Link href="/story">
                  Learn Sudarson&apos;s Story
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
