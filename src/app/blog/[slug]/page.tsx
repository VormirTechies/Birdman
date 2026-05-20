import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { Calendar, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Button } from '@/components/ui/button';
import { blogPosts, getBlogPost } from '@/lib/blog';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://birdmanofchennai.vercel.app';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Birdman of Chennai Blog`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `/blog/${post.slug}`,
      languages: {
        'en-IN': `/blog/${post.slug}`,
        'ta-IN': `/ta/blog/${post.slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      images: [{ url: `${BASE_URL}${post.coverImage}`, width: 1200, height: 630 }],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: `${BASE_URL}${post.coverImage}`,
    datePublished: post.publishedAt,
    url: `${BASE_URL}/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
    articleSection: post.category,
    author: {
      '@type': 'Organization',
      name: 'Birdman of Chennai',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Birdman of Chennai',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <Script
        id={`blog-${post.slug}-schema`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-canopy-dark pt-28 pb-0">
        <div className="container-wide max-w-4xl">
          <AnimatedSection className="pb-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              All articles
            </Link>
            <span className="inline-block bg-sanctuary-green/20 text-sanctuary-green-light text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {post.category}
            </span>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              {post.title}
            </h1>
            <p className="text-white/65 text-lg leading-relaxed max-w-2xl mb-6">
              {post.description}
            </p>
            <div className="flex items-center gap-5 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
          </AnimatedSection>
        </div>
        {/* hero image */}
        <div className="container-wide max-w-5xl">
          <div className="relative aspect-video rounded-t-3xl overflow-hidden shadow-hero">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 100vw, 1024px"
            />
          </div>
        </div>
      </section>

      {/* ── ARTICLE BODY ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-feather-cream">
        <div className="container-wide max-w-3xl">
          <article className="prose prose-lg prose-canopy max-w-none">
            {post.sections.map((section, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                {section.heading && (
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-canopy-dark mt-10 mb-4">
                    {section.heading}
                  </h2>
                )}
                {section.body.split('\n\n').map((paragraph, j) => (
                  <p
                    key={j}
                    className="text-canopy-dark/75 leading-relaxed mb-4 text-base md:text-lg"
                    dangerouslySetInnerHTML={{
                      __html: paragraph
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-canopy-dark">$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                    }}
                  />
                ))}
              </AnimatedSection>
            ))}
          </article>

          {/* CTA inside article */}
          <AnimatedSection className="mt-16 bg-canopy-dark rounded-3xl p-8 md:p-10 text-center">
            <p className="text-sanctuary-green-light font-semibold text-sm uppercase tracking-wide mb-3">
              Experience it yourself
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
              Visit the Sanctuary for Free
            </h3>
            <p className="text-white/65 mb-7 max-w-md mx-auto leading-relaxed">
              Every evening at 4:30 PM — 6,000 wild parakeets, one rooftop, zero cost.
              Book your spot before it fills up.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-sanctuary-green hover:bg-sanctuary-green-light text-white rounded-full px-8 shadow-glow-green"
              >
                <Link href="/book">Book a Free Visit</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-8"
              >
                <Link href="/visit">
                  Plan Your Visit <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── MORE ARTICLES ─────────────────────────────────────────────────── */}
      {otherPosts.length > 0 && (
        <section className="py-16 bg-morning-mist">
          <div className="container-wide max-w-4xl">
            <AnimatedSection className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-canopy-dark">
                More Stories
              </h2>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sanctuary-green font-semibold text-sm hover:gap-2.5 transition-all"
              >
                All articles <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6">
              {otherPosts.map((related) => (
                <AnimatedSection key={related.slug}>
                  <Link
                    href={`/blog/${related.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hero transition-shadow border border-sanctuary-green/10"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={related.coverImage}
                        alt={related.coverImageAlt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-5">
                      <span className="inline-block bg-sanctuary-green/10 text-sanctuary-green text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wide">
                        {related.category}
                      </span>
                      <h3 className="font-display font-bold text-canopy-dark leading-snug group-hover:text-sanctuary-green transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
