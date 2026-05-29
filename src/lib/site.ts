const productionUrl = 'https://www.parrotsudarson.org';

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!configuredUrl) {
    return productionUrl;
  }

  if (
    configuredUrl.includes('localhost') ||
    configuredUrl.includes('127.0.0.1') ||
    configuredUrl.includes('birdmanofchennai.vercel.app')
  ) {
    return productionUrl;
  }

  return normalizeUrl(configuredUrl);
}

export const siteConfig = {
  name: 'Birdman of Chennai',
  legalName: 'Birdman of Chennai Parakeet Sanctuary',
  url: getSiteUrl(),
  domain: 'www.parrotsudarson.org',
  title: "The Birdman of Chennai - Sudarson Sah's Parakeet Sanctuary",
  description:
    "Witness thousands of wild rose-ringed parakeets gathering at Sudarson Sah's rooftop sanctuary in Chintadripet, Chennai. Book a free visit to the Birdman of Chennai.",
  email: 'info@parrotsudarson.org',
  address: {
    streetAddress: 'Iyya Mudali Street, Adikesavarpuram, Chintadripet',
    addressLocality: 'Chennai',
    postalCode: '600002',
    addressRegion: 'Tamil Nadu',
    addressCountry: 'IN',
  },
  coordinates: {
    latitude: 13.0768,
    longitude: 80.2677,
  },
};

export function absoluteUrl(path = '/') {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}
