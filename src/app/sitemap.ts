import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    { path: '/', changeFrequency: 'daily' as const, priority: 1 },
    { path: '/story', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/visit', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/gallery', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/meiyazhagan', changeFrequency: 'monthly' as const, priority: 0.85 },
    { path: '/book', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/feedback', changeFrequency: 'weekly' as const, priority: 0.6 },
  ];

  return [
    ...pages.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];
}
