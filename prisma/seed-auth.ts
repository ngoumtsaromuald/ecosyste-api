import { PrismaClient, UserType, Plan, OAuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAuthData() {
  console.log('🌱 Seeding authentication data...');

  // Create test users with authentication data
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);

  // Create individual user
  const individualUser = await prisma.user.upsert({
    where: { email: 'individual@test.com' },
    update: {},
    create: {
      email: 'individual@test.com',
      passwordHash: hashedPassword,
      name: 'Individual Test User',
      userType: UserType.INDIVIDUAL,
      plan: Plan.FREE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create business user
  const businessUser = await prisma.user.upsert({
    where: { email: 'business@test.com' },
    update: {},
    create: {
      email: 'business@test.com',
      passwordHash: hashedPassword,
      name: 'Business Test User',
      userType: UserType.BUSINESS,
      plan: Plan.PRO,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      name: 'Admin Test User',
      userType: UserType.ADMIN,
      plan: Plan.ENTERPRISE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create OAuth account for individual user
  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerId: {
        provider: OAuthProvider.GOOGLE,
        providerId: 'google-123456',
      },
    },
    update: {},
    create: {
      userId: individualUser.id,
      provider: OAuthProvider.GOOGLE,
      providerId: 'google-123456',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    },
  });

  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: individualUser.id,
        action: 'auth.login.success',
        resource: 'auth',
        details: { timestamp: new Date().toISOString() },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
      },
      {
        userId: businessUser.id,
        action: 'auth.login.success',
        resource: 'auth',
        details: { timestamp: new Date().toISOString() },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 Test Browser',
      },
      {
        userId: adminUser.id,
        action: 'auth.login.success',
        resource: 'auth',
        details: { timestamp: new Date().toISOString() },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 Test Browser',
      },
    ],
  });

  console.log('✅ Authentication data seeded successfully!');
  console.log(`👤 Individual User: ${individualUser.email} (password: TestPassword123!)`);
  console.log(`🏢 Business User: ${businessUser.email} (password: TestPassword123!)`);
  console.log(`👑 Admin User: ${adminUser.email} (password: TestPassword123!)`);
}

async function main() {
  try {
    await seedAuthData();
  } catch (error) {
    console.error('❌ Error seeding authentication data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedAuthData };