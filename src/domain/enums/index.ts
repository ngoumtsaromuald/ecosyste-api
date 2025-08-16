// Enums from Prisma schema
export enum UserType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN',
}

export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum PricingTier {
  STANDARD = 'STANDARD',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum ResourceType {
  BUSINESS = 'BUSINESS',
  SERVICE = 'SERVICE',
  DATA = 'DATA',
  API = 'API',
}

export enum ResourceStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum ResourcePlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  FEATURED = 'FEATURED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}