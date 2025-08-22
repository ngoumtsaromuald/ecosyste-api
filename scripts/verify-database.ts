import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/romapi_core?schema=public"
    }
  }
});

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database setup...');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Count records in each table
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      apiResources: await prisma.apiResource.count(),
      businessHours: await prisma.businessHour.count(),
      resourceImages: await prisma.resourceImage.count(),
      apiKeys: await prisma.apiKey.count(),
      subscriptions: await prisma.subscription.count(),
      analyticsEvents: await prisma.analyticsEvent.count(),
    };

    console.log('\n📊 Database Summary:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   • ${table}: ${count} records`);
    });

    // Test some queries
    console.log('\n🧪 Testing queries...');

    // Get active API resources with categories
    const activeResources = await prisma.apiResource.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true },
      take: 3
    });

    console.log(`✅ Found ${activeResources.length} active API resources:`);
    activeResources.forEach(resource => {
      console.log(`   • ${resource.name} (${resource.category.name})`);
    });

    // Test user with API keys
    const usersWithKeys = await prisma.user.findMany({
      include: { apiKeys: true },
      take: 2
    });

    console.log(`✅ Found ${usersWithKeys.length} users with API keys:`);
    usersWithKeys.forEach(user => {
      console.log(`   • ${user.name}: ${user.apiKeys.length} API key(s)`);
    });

    // Test business hours
    const resourcesWithHours = await prisma.apiResource.findMany({
      include: { hours: true },
      where: { hours: { some: {} } },
      take: 2
    });

    console.log(`✅ Found ${resourcesWithHours.length} resources with business hours:`);
    resourcesWithHours.forEach(resource => {
      console.log(`   • ${resource.name}: ${resource.hours.length} hour entries`);
    });

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('   • Admin: admin@romapi.com / password123');
    console.log('   • Business: business@example.com / password123');
    console.log('   • Developer: developer@example.com / password123');
    console.log('   • Premium: premium@example.com / password123');

    console.log('\n🚀 Next Steps:');
    console.log('   • Start the application: npm run start:dev');
    console.log('   • View data in Prisma Studio: npm run prisma:studio');
    console.log('   • Run tests: npm run test');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();