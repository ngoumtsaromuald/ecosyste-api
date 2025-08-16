import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test query execution
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query execution successful:', result);
    
    // Test if tables exist (after migration)
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Tables exist - User count: ${userCount}`);
    } catch (error) {
      console.log('⚠️  Tables not yet created (run migrations first)');
    }
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();