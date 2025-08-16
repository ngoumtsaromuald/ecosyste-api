import { ResourceType, ResourceStatus, ResourcePlan } from '../enums';
import { Address, Contact, SeoData } from '../value-objects';

export class ApiResourceDomain {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly resourceType: ResourceType,
    public readonly categoryId: string,
    public readonly address: Address | null,
    public readonly contact: Contact | null,
    public readonly status: ResourceStatus,
    public readonly plan: ResourcePlan,
    public readonly verified: boolean,
    public readonly seo: SeoData | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly publishedAt: Date | null,
    public readonly deletedAt: Date | null,
  ) {}

  static create(data: {
    id: string;
    userId: string;
    name: string;
    slug?: string;
    description?: string | null;
    resourceType: ResourceType;
    categoryId: string;
    address?: Address | null;
    contact?: Contact | null;
    status?: ResourceStatus;
    plan?: ResourcePlan;
    verified?: boolean;
    seo?: SeoData | null;
    createdAt?: Date;
    updatedAt?: Date;
    publishedAt?: Date | null;
    deletedAt?: Date | null;
  }): ApiResourceDomain {
    return new ApiResourceDomain(
      data.id,
      data.userId,
      data.name,
      data.slug || ApiResourceDomain.generateSlug(data.name),
      data.description || null,
      data.resourceType,
      data.categoryId,
      data.address || null,
      data.contact || null,
      data.status || ResourceStatus.PENDING,
      data.plan || ResourcePlan.FREE,
      data.verified || false,
      data.seo || null,
      data.createdAt || new Date(),
      data.updatedAt || new Date(),
      data.publishedAt || null,
      data.deletedAt || null,
    );
  }

  // Business logic methods
  isPublished(): boolean {
    return this.status === ResourceStatus.ACTIVE && 
           this.publishedAt !== null && 
           this.deletedAt === null;
  }

  canBeUpdatedBy(userId: string): boolean {
    return this.userId === userId && this.deletedAt === null;
  }

  canBePublished(): boolean {
    const validationErrors = this.validate();
    return validationErrors.length === 0 && 
           this.status !== ResourceStatus.SUSPENDED &&
           this.deletedAt === null;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isPremium(): boolean {
    return this.plan === ResourcePlan.PREMIUM || this.plan === ResourcePlan.FEATURED;
  }

  requiresApproval(): boolean {
    return this.status === ResourceStatus.PENDING;
  }

  // Validation methods
  validate(): string[] {
    const errors: string[] = [];

    // Basic validation
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (this.name && this.name.length > 255) {
      errors.push('Name must be less than 255 characters');
    }

    if (!this.slug || this.slug.trim().length === 0) {
      errors.push('Slug is required');
    }

    if (this.slug && !this.isValidSlug(this.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    if (this.description && this.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!this.categoryId || this.categoryId.trim().length === 0) {
      errors.push('Category ID is required');
    }

    // Validate value objects
    if (this.address) {
      errors.push(...this.address.validate());
    }

    if (this.contact) {
      errors.push(...this.contact.validate());
    }

    if (this.seo) {
      errors.push(...this.seo.validate());
    }

    // Business-specific validation
    if (this.resourceType === ResourceType.BUSINESS) {
      if (!this.address || !this.address.isComplete()) {
        errors.push('Business resources must have a complete address');
      }

      if (!this.contact || !this.contact.hasAnyContact()) {
        errors.push('Business resources must have at least one contact method');
      }
    }

    return errors;
  }

  // Transformation methods
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  regenerateSlug(): ApiResourceDomain {
    const newSlug = ApiResourceDomain.generateSlug(this.name);
    return this.withSlug(newSlug);
  }

  // Immutable update methods
  withName(name: string): ApiResourceDomain {
    return new ApiResourceDomain(
      this.id,
      this.userId,
      name,
      this.slug,
      this.description,
      this.resourceType,
      this.categoryId,
      this.address,
      this.contact,
      this.status,
      this.plan,
      this.verified,
      this.seo,
      this.createdAt,
      new Date(), // Update timestamp
      this.publishedAt,
      this.deletedAt,
    );
  }

  withSlug(slug: string): ApiResourceDomain {
    return new ApiResourceDomain(
      this.id,
      this.userId,
      this.name,
      slug,
      this.description,
      this.resourceType,
      this.categoryId,
      this.address,
      this.contact,
      this.status,
      this.plan,
      this.verified,
      this.seo,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.deletedAt,
    );
  }

  withStatus(status: ResourceStatus): ApiResourceDomain {
    const publishedAt = status === ResourceStatus.ACTIVE && !this.publishedAt 
      ? new Date() 
      : this.publishedAt;

    return new ApiResourceDomain(
      this.id,
      this.userId,
      this.name,
      this.slug,
      this.description,
      this.resourceType,
      this.categoryId,
      this.address,
      this.contact,
      status,
      this.plan,
      this.verified,
      this.seo,
      this.createdAt,
      new Date(),
      publishedAt,
      this.deletedAt,
    );
  }

  withPlan(plan: ResourcePlan): ApiResourceDomain {
    return new ApiResourceDomain(
      this.id,
      this.userId,
      this.name,
      this.slug,
      this.description,
      this.resourceType,
      this.categoryId,
      this.address,
      this.contact,
      this.status,
      plan,
      this.verified,
      this.seo,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.deletedAt,
    );
  }

  withVerified(verified: boolean): ApiResourceDomain {
    return new ApiResourceDomain(
      this.id,
      this.userId,
      this.name,
      this.slug,
      this.description,
      this.resourceType,
      this.categoryId,
      this.address,
      this.contact,
      this.status,
      this.plan,
      verified,
      this.seo,
      this.createdAt,
      new Date(),
      this.publishedAt,
      this.deletedAt,
    );
  }

  markAsDeleted(): ApiResourceDomain {
    return new ApiResourceDomain(
      this.id,
      this.userId,
      this.name,
      this.slug,
      this.description,
      this.resourceType,
      this.categoryId,
      this.address,
      this.contact,
      this.status,
      this.plan,
      this.verified,
      this.seo,
      this.createdAt,
      new Date(),
      this.publishedAt,
      new Date(), // Set deletedAt
    );
  }

  // Helper methods
  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  equals(other: ApiResourceDomain): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `ApiResource(${this.id}, ${this.name}, ${this.status})`;
  }
}