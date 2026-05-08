import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Birdman of Chennai',
    short_name: 'Birdman',
    description:
      "Witness ~6,000 wild parakeets gather every evening at Sudarson Sah's rooftop sanctuary in Chintadripet, Chennai.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1a2e1a',
    background_color: '#f5f5f0',
    icons: [
      {
        src: '/images/parrot_logo.PNG',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
