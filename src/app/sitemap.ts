import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://birdmanofchennai.vercel.app';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          en: baseUrl,
          ta: `${baseUrl}/ta`,
        },
      },
    },
    {
      url: `${baseUrl}/story`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/story`,
          ta: `${baseUrl}/ta/story`,
        },
      },
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/gallery`,
          ta: `${baseUrl}/ta/gallery`,
        },
      },
    },
    {
      url: `${baseUrl}/book`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/book`,
          ta: `${baseUrl}/ta/book`,
        },
      },
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: {
        languages: {
          en: `${baseUrl}/feedback`,
          ta: `${baseUrl}/ta/feedback`,
        },
      },
    },
    {
      url: `${baseUrl}/visit`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/visit`,
          ta: `${baseUrl}/ta/visit`,
        },
      },
    },
    {
      url: `${baseUrl}/meiyazhagan`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
      alternates: {
        languages: {
          en: `${baseUrl}/meiyazhagan`,
          ta: `${baseUrl}/ta/meiyazhagan`,
        },
      },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/blog`,
          ta: `${baseUrl}/ta/blog`,
        },
      },
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      alternates: {
        languages: {
          en: `${baseUrl}/blog/${post.slug}`,
          ta: `${baseUrl}/ta/blog/${post.slug}`,
        },
      },
    })),
  ];
}
