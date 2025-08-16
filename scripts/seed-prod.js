#!/usr/bin/env node

/**
 * Production seed script for ROMAPI Backend Core
 * This script seeds the database with initial production data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const prisma = new PrismaClient();

// Production seed data
const seedData = {
  categories: [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology and software services',
      icon: 'tech',
      children: [
        { name: 'Software Development', slug: 'software-development', description: 'Custom software development services' },
        { name: 'Web Development', slug: 'web-development', description: 'Web application development' },
        { name: 'Mobile Development', slug: 'mobile-development', description: 'Mobile app development' },
        { name: 'DevOps', slug: 'devops', description: 'DevOps and infrastructure services' }
      ]
    },
    {
      name: 'Business Services',
      slug: 'business-services',
      description: 'Professional business services',
      icon: 'business',
      children: [
        { name: 'Consulting', slug: 'consulting', description: 'Business consulting services' },
        { name: 'Marketing', slug: 'marketing', description: 'Digital marketing services' },
        { name: 'Finance', slug: 'finance', description: 'Financial services' },
        { name: 'Legal', slug: 'legal', description: 'Legal services' }
      ]
    },
    {
      name: 'Healthcare',
      slug: 'healthcare',
      description: 'Healthcare and medical services',
      icon: 'health',
      children: [
        { name: 'Telemedicine', slug: 'telemedicine', description: 'Remote healthcare services' },
        { name: 'Medical Equipment', slug: 'medical-equipment', description: 'Medical equipment and supplies' },
        { name: 'Pharmaceuticals', slug: 'pharmaceuticals', description: 'Pharmaceutical services' }
      ]
    },
    {
      name: 'Education',
      slug: 'education',
      description: 'Educational services and platforms',
      icon: 'education',
      children: [
        { name: 'Online Learning', slug: 'online-learning', description: 'Online education platforms' },
        { name: 'Training', slug: 'training', description: 'Professional training services' },
        { name: 'Certification', slug: 'certification', description: 'Certification programs' }
      ]
    }
  ],
  
  adminUser: {
    email: 'admin@romapi.com',
    name: 'ROMAPI Administrator',
    userType: 'ADMIN',
    plan: 'ENTERPRISE',
    pricingTier: 'ENTERPRISE'
  }
};

// Seed categories
const seedCategories = async () => {
  log('🌱 Seeding categories...', 'blue');
  
  for (const categoryData of seedData.categories) {
    const { children, ...parentData } = categoryData;
    
    // Create parent category
    const parentCategory = await prisma.category.upsert({
      where: { slug: parentData.slug },
      update: parentData,
      create: parentData
    });
    
    log(`✅ Created/updated category: ${parentCategory.name}`, 'green');
    
    // Create child categories
    if (children && children.length > 0) {
      for (const childData of children) {
        const childCategory = await prisma.category.upsert({
          where: { slug: childData.slug },
          update: { ...childData, parentId: parentCategory.id },
          create: { ...childData, parentId: parentCategory.id }
        });
        
        log(`  ✅ Created/updated subcategory: ${childCategory.name}`, 'green');
      }
    }
  }
  
  log('✅ Categories seeding completed', 'green');
};

// Seed admin user
const seedAdminUser = async () => {
  log('👤 Seeding admin user...', 'blue');
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: seedData.adminUser.email },
    update: {
      ...seedData.adminUser,
      passwordHash: hashedPassword
    },
    create: {
      ...seedData.adminUser,
      passwordHash: hashedPassword
    }
  });
  
  log(`✅ Created/updated admin user: ${adminUser.email}`, 'green');
  
  if (process.env.NODE_ENV !== 'production') {
    log(`🔑 Admin password: ${adminPassword}`, 'yellow');
  }
};

// Seed sample API resources (only for non-production)
const seedSampleResources = async () => {
  if (process.env.NODE_ENV === 'production') {
    log('⏭️  Skipping sample resources in production', 'yellow');
    return;
  }
  
  log('🏢 Seeding sample API resources...', 'blue');
  
  // Get admin user and a category
  const adminUser = await prisma.user.findUnique({
    where: { email: seedData.adminUser.email }
  });
  
  const techCategory = await prisma.category.findUnique({
    where: { slug: 'software-development' }
  });
  
  if (!adminUser || !techCategory) {
    log('⚠️  Admin user or category not found, skipping sample resources', 'yellow');
    return;
  }
  
  const sampleResources = [
    {
      name: 'ROMAPI Core Services',
      slug: 'romapi-core-services',
      description: 'Core API services for the ROMAPI ecosystem',
      resourceType: 'API',
      categoryId: techCategory.id,
      userId: adminUser.id,
      status: 'ACTIVE',
      plan: 'FEATURED',
      verified: true,
      addressLine1: '123 Tech Street',
      city: 'Yaoundé',
      region: 'Centre',
      country: 'CM',
      phone: '+237123456789',
      email: 'contact@romapi.com',
      website: 'https://romapi.com',
      metaTitle: 'ROMAPI Core Services - API Ecosystem',
      metaDescription: 'Comprehensive API services for modern applications'
    }
  ];
  
  for (const resourceData of sampleResources) {
    const resource = await prisma.apiResource.upsert({
      where: { slug: resourceData.slug },
      update: resourceData,
      create: resourceData
    });
    
    log(`✅ Created/updated resource: ${resource.name}`, 'green');
  }
  
  log('✅ Sample resources seeding completed', 'green');
};

// Main seeding process
const main = async () => {
  log('🚀 Starting production seeding process...', 'green');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  
  try {
    // Seed categories
    await seedCategories();
    
    // Seed admin user
    await seedAdminUser();
    
    // Seed sample resources (non-production only)
    await seedSampleResources();
    
    log('🎉 Seeding process completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Seeding process failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'categories':
    seedCategories().finally(() => prisma.$disconnect());
    break;
    
  case 'admin':
    seedAdminUser().finally(() => prisma.$disconnect());
    break;
    
  case 'resources':
    seedSampleResources().finally(() => prisma.$disconnect());
    break;
    
  default:
    main();
    break;
}

module.exports = {
  seedCategories,
  seedAdminUser,
  seedSampleResources
};