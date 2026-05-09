import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://birdmanofchennai.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date('2025-08-10'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/story`,
      lastModified: new Date('2025-08-10'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date('2025-08-10'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date('2025-06-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date('2025-08-10'),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
