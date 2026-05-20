import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { Calendar, Clock, ArrowRight, Rss } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated-section';
import { blogPosts } from '@/lib/blog';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://birdmanofchennai.vercel.app';

export const metadata: Metadata = {
  title: 'Blog — Birdman of Chennai | Parakeet Stories, Nature & Wildlife',
  description:
    'Stories, guides, and insights from the Birdman of Chennai sanctuary. Read about the daily parakeet gathering, wildlife photography tips, rose-ringed parakeet behaviour, and the extraordinary bond between Sudarson Sah and 6,000 wild birds.',
  keywords: [
    'birdman of chennai blog',
    'parakeet stories chennai',
    'wild parakeet blog india',
    'rose ringed parakeet articles',
    'urban wildlife chennai',
    'bird photography guide india',
  ],
  alternates: {
    canonical: '/blog',
    languages: { 'en-IN': '/blog', 'ta-IN': '/ta/blog' },
  },
  openGraph: {
    title: 'Blog — Birdman of Chennai',
    description:
      'Stories, photography guides, and wildlife insights from the Birdman of Chennai sanctuary.',
    url: `${BASE_URL}/blog`,
    images: [{ url: '/images/og-image.png', width: 1200, height: 1200 }],
  },
};

const categories = Array.from(new Set(blogPosts.map((p) => p.category)));

export default function BlogPage() {
  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Birdman of Chennai — Blog',
    url: `${BASE_URL}/blog`,
    description:
      'Stories, guides, and wildlife insights from the Birdman of Chennai sanctuary in Chintadripet, Chennai.',
    publisher: {
      '@type': 'Organization',
      name: 'Birdman of Chennai',
      url: BASE_URL,
    },
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      image: `${BASE_URL}${post.coverImage}`,
    })),
  };

  return (
    <>
      <Script
        id="blog-list-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-canopy-dark pt-32 pb-16">
        <div className="container-wide">
          <AnimatedSection>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-sanctuary-green/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                <Rss className="w-6 h-6 text-sanctuary-green-light" />
              </div>
              <div>
                <span className="inline-block bg-sanctuary-green/20 text-sanctuary-green-light text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                  Stories from the Sanctuary
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                  The Birdman Blog
                </h1>
              </div>
            </div>
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed ml-16">
              Insights, guides, and stories from the rooftop sanctuary where 6,000 wild
              parakeets come home every evening.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── POSTS GRID ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-feather-cream min-h-[60vh]">
        <div className="container-wide">
          {/* category pills */}
          <AnimatedSection className="flex flex-wrap gap-2 mb-12">
            <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-canopy-dark text-white">
              All
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-morning-mist text-canopy-dark/70 border border-sanctuary-green/10"
              >
                {cat}
              </span>
            ))}
          </AnimatedSection>

          {/* featured first post */}
          <AnimatedSection className="mb-12">
            <Link
              href={`/blog/${blogPosts[0].slug}`}
              className="group block bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-hero transition-shadow duration-300 border border-sanctuary-green/10"
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative aspect-video lg:aspect-auto">
                  <Image
                    src={blogPosts[0].coverImage}
                    alt={blogPosts[0].coverImageAlt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                    {blogPosts[0].category}
                  </span>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-canopy-dark mb-4 leading-snug group-hover:text-sanctuary-green transition-colors">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-canopy-dark/60 leading-relaxed mb-6 line-clamp-3">
                    {blogPosts[0].description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-canopy-dark/40 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(blogPosts[0].publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {blogPosts[0].readTime}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sanctuary-green font-semibold text-sm group-hover:gap-2 transition-all">
                      Read <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </AnimatedSection>

          {/* remaining posts */}
          <StaggerContainer className="grid md:grid-cols-2 gap-6">
            {blogPosts.slice(1).map((post) => (
              <StaggerItem key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hero transition-shadow duration-300 border border-sanctuary-green/10 h-full"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={post.coverImage}
                      alt={post.coverImageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide w-fit">
                      {post.category}
                    </span>
                    <h2 className="font-display text-xl font-bold text-canopy-dark mb-2 leading-snug group-hover:text-sanctuary-green transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-canopy-dark/60 text-sm leading-relaxed mb-4 line-clamp-3">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-sanctuary-green/10">
                      <div className="flex items-center gap-3 text-canopy-dark/40 text-xs">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-sanctuary-green group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <Footer />
    </>
  );
}
