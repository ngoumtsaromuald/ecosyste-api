import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  title: {
    default: 'ECOSYSTE - Plateforme d\'APIs Écologiques',
    template: '%s | ECOSYSTE'
  },
  description: 'Découvrez et intégrez facilement des APIs écologiques pour vos projets. ECOSYSTE vous connecte aux meilleures solutions durables.',
  keywords: [
    'API écologique',
    'développement durable',
    'APIs vertes',
    'plateforme API',
    'écosystème numérique',
    'développement responsable'
  ],
  authors: [{ name: 'ECOSYSTE Team' }],
  creator: 'ECOSYSTE',
  publisher: 'ECOSYSTE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ecosyste.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ecosyste.app',
    title: 'ECOSYSTE - Plateforme d\'APIs Écologiques',
    description: 'Découvrez et intégrez facilement des APIs écologiques pour vos projets.',
    siteName: 'ECOSYSTE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ECOSYSTE - Plateforme d\'APIs Écologiques',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ECOSYSTE - Plateforme d\'APIs Écologiques',
    description: 'Découvrez et intégrez facilement des APIs écologiques pour vos projets.',
    images: ['/og-image.png'],
    creator: '@ecosyste_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
}: {
  title: string
  description: string
  path?: string
  image?: string
}): Metadata {
  const url = `https://ecosyste.app${path}`
  const ogImage = image || '/og-image.png'

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title,
      description,
      images: [ogImage],
    },
  }
}

// Structured data helpers
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ECOSYSTE',
  url: 'https://ecosyste.app',
  logo: 'https://ecosyste.app/logo.png',
  description: 'Plateforme d\'APIs écologiques pour le développement durable',
  sameAs: [
    'https://twitter.com/ecosyste_app',
    'https://linkedin.com/company/ecosyste',
  ],
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ECOSYSTE',
  url: 'https://ecosyste.app',
  description: 'Découvrez et intégrez facilement des APIs écologiques pour vos projets',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://ecosyste.app/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}