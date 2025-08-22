import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ecosyste.app'
  const currentDate = new Date().toISOString()

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  // TODO: Add dynamic pages when API is available
  // Example for API pages:
  // const apiPages = await fetch(`${process.env.API_URL}/apis`)
  //   .then(res => res.json())
  //   .then(apis => apis.map(api => ({
  //     url: `${baseUrl}/api/${api.slug}`,
  //     lastModified: api.updatedAt,
  //     changeFrequency: 'weekly' as const,
  //     priority: 0.6,
  //   })))
  //   .catch(() => [])

  // Category pages (example)
  const categoryPages = [
    'ai-machine-learning',
    'data-analytics',
    'payment-fintech',
    'communication',
    'geolocation',
    'weather-environment',
    'social-media',
    'e-commerce',
    'productivity',
    'security'
  ].map(category => ({
    url: `${baseUrl}/catalog?category=${category}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    // ...apiPages, // Uncomment when API is available
  ]
}