import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum DTOs for OpenAPI schema generation
 * These classes ensure enums are properly included in the generated OpenAPI specification
 */

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

// DTO classes to ensure enums appear in OpenAPI schema
export class ResourceTypeDto {
  @ApiProperty({
    enum: ResourceType,
    description: 'Type of API resource',
    example: ResourceType.BUSINESS
  })
  value: ResourceType;
}

export class ResourceStatusDto {
  @ApiProperty({
    enum: ResourceStatus,
    description: 'Status of API resource',
    example: ResourceStatus.ACTIVE
  })
  value: ResourceStatus;
}

export class ResourcePlanDto {
  @ApiProperty({
    enum: ResourcePlan,
    description: 'Plan type for API resource',
    example: ResourcePlan.FREE
  })
  value: ResourcePlan;
}

export class UserTypeDto {
  @ApiProperty({
    enum: UserType,
    description: 'Type of user account',
    example: UserType.INDIVIDUAL
  })
  value: UserType;
}

export class PlanDto {
  @ApiProperty({
    enum: Plan,
    description: 'User subscription plan',
    example: Plan.FREE
  })
  value: Plan;
}

export class PricingTierDto {
  @ApiProperty({
    enum: PricingTier,
    description: 'Pricing tier for services',
    example: PricingTier.STANDARD
  })
  value: PricingTier;
}