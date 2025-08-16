import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');
    
    // Step 1: Test connection
    console.log('\n1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Step 2: Generate Prisma client
    console.log('\n2️⃣ Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
    
    // Step 3: Apply migrations (if database supports it)
    console.log('\n3️⃣ Applying database migrations...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Database schema applied');
    } catch (error) {
      console.log('⚠️  Migration failed, trying alternative approach...');
      // If migrate fails, we can still proceed with the manual migration
    }
    
    // Step 4: Check if tables exist
    console.log('\n4️⃣ Verifying database schema...');
    try {
      await prisma.user.count();
      console.log('✅ Database schema verified');
    } catch (error) {
      console.log('❌ Database schema not ready:', error.message);
      throw error;
    }
    
    // Step 5: Seed database
    console.log('\n5️⃣ Seeding database with test data...');
    execSync('npm run prisma:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 You can now:');
    console.log('   • Start the application: npm run start:dev');
    console.log('   • View data in Prisma Studio: npm run prisma:studio');
    console.log('   • Run tests: npm run test');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure PostgreSQL is running');
    console.log('   • Check your DATABASE_URL in .env file');
    console.log('   • Verify database credentials');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();