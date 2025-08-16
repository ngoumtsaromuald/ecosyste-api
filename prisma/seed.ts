import { PrismaClient, UserType, Plan, ResourceType, ResourceStatus, ResourcePlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.analyticsEvent.deleteMany();
  await prisma.resourceImage.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.apiResource.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Restaurants & Alimentation',
        slug: 'restaurants-alimentation',
        description: 'Restaurants, bars, cafés et commerces alimentaires',
        icon: '🍽️',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Services Professionnels',
        slug: 'services-professionnels',
        description: 'Avocats, comptables, consultants et autres services professionnels',
        icon: '💼',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Santé & Bien-être',
        slug: 'sante-bien-etre',
        description: 'Médecins, pharmacies, centres de bien-être',
        icon: '🏥',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Commerce & Retail',
        slug: 'commerce-retail',
        description: 'Magasins, boutiques et centres commerciaux',
        icon: '🛍️',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Technologies & IT',
        slug: 'technologies-it',
        description: 'Services informatiques, développement, support technique',
        icon: '💻',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create subcategories
  const subcategories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Restaurants Traditionnels',
        slug: 'restaurants-traditionnels',
        description: 'Cuisine locale et traditionnelle',
        icon: '🍲',
        parentId: categories[0].id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fast Food',
        slug: 'fast-food',
        description: 'Restauration rapide',
        icon: '🍔',
        parentId: categories[0].id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Développement Web',
        slug: 'developpement-web',
        description: 'Création de sites web et applications',
        icon: '🌐',
        parentId: categories[4].id,
      },
    }),
  ]);

  console.log(`✅ Created ${subcategories.length} subcategories`);

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@romapi.com',
        passwordHash,
        name: 'Admin ROMAPI',
        userType: UserType.ADMIN,
        plan: Plan.ENTERPRISE,
        apiQuota: 100000,
        apiUsage: 0,
      },
    }),
    prisma.user.create({
      data: {
        email: 'business@example.com',
        passwordHash,
        name: 'Restaurant Le Cameroun',
        userType: UserType.BUSINESS,
        plan: Plan.PRO,
        apiQuota: 10000,
        apiUsage: 150,
      },
    }),
    prisma.user.create({
      data: {
        email: 'developer@example.com',
        passwordHash,
        name: 'Jean Dupont',
        userType: UserType.INDIVIDUAL,
        plan: Plan.FREE,
        apiQuota: 1000,
        apiUsage: 45,
      },
    }),
    prisma.user.create({
      data: {
        email: 'premium@example.com',
        passwordHash,
        name: 'TechCorp Solutions',
        userType: UserType.BUSINESS,
        plan: Plan.PREMIUM,
        apiQuota: 50000,
        apiUsage: 2340,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create API Resources
  const apiResources = await Promise.all([
    prisma.apiResource.create({
      data: {
        userId: users[1].id,
        name: 'Restaurant Le Cameroun',
        slug: 'restaurant-le-cameroun',
        description: 'Restaurant traditionnel camerounais au cœur de Douala. Spécialités locales et ambiance authentique.',
        resourceType: ResourceType.BUSINESS,
        categoryId: subcategories[0].id,
        addressLine1: '123 Avenue de la Liberté',
        city: 'Douala',
        region: 'Littoral',
        postalCode: '1234',
        country: 'CM',
        latitude: 4.0511,
        longitude: 9.7679,
        phone: '+237 233 42 12 34',
        email: 'contact@lecameroun.cm',
        website: 'https://lecameroun.cm',
        status: ResourceStatus.ACTIVE,
        plan: ResourcePlan.PREMIUM,
        verified: true,
        metaTitle: 'Restaurant Le Cameroun - Cuisine Traditionnelle à Douala',
        metaDescription: 'Découvrez la cuisine camerounaise authentique au Restaurant Le Cameroun. Plats traditionnels, ambiance chaleureuse.',
        publishedAt: new Date(),
      },
    }),
    prisma.apiResource.create({
      data: {
        userId: users[2].id,
        name: 'DevCorp Solutions',
        slug: 'devcorp-solutions',
        description: 'Agence de développement web et mobile spécialisée dans les solutions sur mesure pour entreprises.',
        resourceType: ResourceType.SERVICE,
        categoryId: subcategories[2].id,
        addressLine1: '456 Rue des Développeurs',
        city: 'Yaoundé',
        region: 'Centre',
        postalCode: '5678',
        country: 'CM',
        latitude: 3.8480,
        longitude: 11.5021,
        phone: '+237 222 33 44 55',
        email: 'hello@devcorp.cm',
        website: 'https://devcorp.cm',
        status: ResourceStatus.ACTIVE,
        plan: ResourcePlan.FREE,
        verified: true,
        metaTitle: 'DevCorp Solutions - Développement Web & Mobile',
        metaDescription: 'Agence de développement web et mobile au Cameroun. Solutions sur mesure pour votre entreprise.',
        publishedAt: new Date(),
      },
    }),
    prisma.apiResource.create({
      data: {
        userId: users[3].id,
        name: 'TechCorp API Gateway',
        slug: 'techcorp-api-gateway',
        description: 'API Gateway haute performance pour la gestion et la sécurisation de vos APIs.',
        resourceType: ResourceType.API,
        categoryId: categories[4].id,
        addressLine1: '789 Tech Boulevard',
        city: 'Douala',
        region: 'Littoral',
        postalCode: '9012',
        country: 'CM',
        phone: '+237 233 55 66 77',
        email: 'api@techcorp.cm',
        website: 'https://api.techcorp.cm',
        status: ResourceStatus.ACTIVE,
        plan: ResourcePlan.FEATURED,
        verified: true,
        metaTitle: 'TechCorp API Gateway - Gestion d\'APIs',
        metaDescription: 'Solution complète de gestion d\'APIs avec sécurité avancée et monitoring en temps réel.',
        publishedAt: new Date(),
      },
    }),
    prisma.apiResource.create({
      data: {
        userId: users[1].id,
        name: 'Quick Burger Douala',
        slug: 'quick-burger-douala',
        description: 'Fast food moderne avec burgers artisanaux et service rapide.',
        resourceType: ResourceType.BUSINESS,
        categoryId: subcategories[1].id,
        addressLine1: '321 Avenue du Commerce',
        city: 'Douala',
        region: 'Littoral',
        postalCode: '3456',
        country: 'CM',
        latitude: 4.0611,
        longitude: 9.7779,
        phone: '+237 233 88 99 00',
        email: 'info@quickburger.cm',
        status: ResourceStatus.PENDING,
        plan: ResourcePlan.FREE,
        verified: false,
        metaTitle: 'Quick Burger Douala - Fast Food Artisanal',
        metaDescription: 'Burgers artisanaux et service rapide au cœur de Douala.',
      },
    }),
  ]);

  console.log(`✅ Created ${apiResources.length} API resources`);

  // Create Business Hours
  const businessHours = [];
  for (const resource of apiResources.slice(0, 2)) { // Only for first 2 resources
    for (let day = 1; day <= 7; day++) {
      if (day === 7) { // Sunday closed for restaurant
        businessHours.push(
          await prisma.businessHour.create({
            data: {
              resourceId: resource.id,
              dayOfWeek: day,
              isClosed: true,
            },
          })
        );
      } else {
        businessHours.push(
          await prisma.businessHour.create({
            data: {
              resourceId: resource.id,
              dayOfWeek: day,
              openTime: resource.name.includes('Restaurant') ? '11:00' : '08:00',
              closeTime: resource.name.includes('Restaurant') ? '23:00' : '18:00',
              isClosed: false,
            },
          })
        );
      }
    }
  }

  console.log(`✅ Created ${businessHours.length} business hours`);

  // Create Resource Images
  const resourceImages = await Promise.all([
    prisma.resourceImage.create({
      data: {
        resourceId: apiResources[0].id,
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        altText: 'Restaurant Le Cameroun - Vue intérieure',
        isPrimary: true,
        orderIndex: 0,
      },
    }),
    prisma.resourceImage.create({
      data: {
        resourceId: apiResources[0].id,
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        altText: 'Restaurant Le Cameroun - Plat traditionnel',
        isPrimary: false,
        orderIndex: 1,
      },
    }),
    prisma.resourceImage.create({
      data: {
        resourceId: apiResources[1].id,
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        altText: 'DevCorp Solutions - Bureau moderne',
        isPrimary: true,
        orderIndex: 0,
      },
    }),
    prisma.resourceImage.create({
      data: {
        resourceId: apiResources[3].id,
        url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
        altText: 'Quick Burger - Burger artisanal',
        isPrimary: true,
        orderIndex: 0,
      },
    }),
  ]);

  console.log(`✅ Created ${resourceImages.length} resource images`);

  // Create API Keys
  const apiKeys = await Promise.all([
    prisma.apiKey.create({
      data: {
        userId: users[0].id,
        name: 'Admin Master Key',
        keyHash: 'hashed_admin_key_123',
        keyPrefix: 'rk_admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        rateLimit: 10000,
        isActive: true,
      },
    }),
    prisma.apiKey.create({
      data: {
        userId: users[1].id,
        name: 'Business API Key',
        keyHash: 'hashed_business_key_456',
        keyPrefix: 'rk_biz',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        isActive: true,
      },
    }),
    prisma.apiKey.create({
      data: {
        userId: users[2].id,
        name: 'Developer Test Key',
        keyHash: 'hashed_dev_key_789',
        keyPrefix: 'rk_dev',
        permissions: ['read'],
        rateLimit: 100,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${apiKeys.length} API keys`);

  // Create Subscriptions
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        userId: users[1].id,
        plan: Plan.PRO,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    }),
    prisma.subscription.create({
      data: {
        userId: users[3].id,
        plan: Plan.PREMIUM,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    }),
  ]);

  console.log(`✅ Created ${subscriptions.length} subscriptions`);

  // Create Analytics Events
  const analyticsEvents = [];
  for (const resource of apiResources.slice(0, 3)) {
    for (let i = 0; i < 10; i++) {
      analyticsEvents.push(
        await prisma.analyticsEvent.create({
          data: {
            resourceId: resource.id,
            eventType: ['view', 'click', 'contact', 'share'][Math.floor(Math.random() * 4)],
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            referrer: 'https://google.com',
            metadata: {
              source: 'web',
              campaign: 'organic',
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          },
        })
      );
    }
  }

  console.log(`✅ Created ${analyticsEvents.length} analytics events`);

  // Summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${categories.length} main categories`);
  console.log(`   • ${subcategories.length} subcategories`);
  console.log(`   • ${users.length} users`);
  console.log(`   • ${apiResources.length} API resources`);
  console.log(`   • ${businessHours.length} business hours`);
  console.log(`   • ${resourceImages.length} resource images`);
  console.log(`   • ${apiKeys.length} API keys`);
  console.log(`   • ${subscriptions.length} subscriptions`);
  console.log(`   • ${analyticsEvents.length} analytics events`);
  
  console.log('\n🔑 Test Credentials:');
  console.log('   Admin: admin@romapi.com / password123');
  console.log('   Business: business@example.com / password123');
  console.log('   Developer: developer@example.com / password123');
  console.log('   Premium: premium@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });