"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResourceDomain = void 0;
const enums_1 = require("../enums");
class ApiResourceDomain {
    constructor(id, userId, name, slug, description, resourceType, categoryId, address, contact, status, plan, verified, seo, createdAt, updatedAt, publishedAt, deletedAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.resourceType = resourceType;
        this.categoryId = categoryId;
        this.address = address;
        this.contact = contact;
        this.status = status;
        this.plan = plan;
        this.verified = verified;
        this.seo = seo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.publishedAt = publishedAt;
        this.deletedAt = deletedAt;
    }
    static create(data) {
        return new ApiResourceDomain(data.id, data.userId, data.name, data.slug || ApiResourceDomain.generateSlug(data.name), data.description || null, data.resourceType, data.categoryId, data.address || null, data.contact || null, data.status || enums_1.ResourceStatus.PENDING, data.plan || enums_1.ResourcePlan.FREE, data.verified || false, data.seo || null, data.createdAt || new Date(), data.updatedAt || new Date(), data.publishedAt || null, data.deletedAt || null);
    }
    isPublished() {
        return this.status === enums_1.ResourceStatus.ACTIVE &&
            this.publishedAt !== null &&
            this.deletedAt === null;
    }
    canBeUpdatedBy(userId) {
        return this.userId === userId && this.deletedAt === null;
    }
    canBePublished() {
        const validationErrors = this.validate();
        return validationErrors.length === 0 &&
            this.status !== enums_1.ResourceStatus.SUSPENDED &&
            this.deletedAt === null;
    }
    isDeleted() {
        return this.deletedAt !== null;
    }
    isPremium() {
        return this.plan === enums_1.ResourcePlan.PREMIUM || this.plan === enums_1.ResourcePlan.FEATURED;
    }
    requiresApproval() {
        return this.status === enums_1.ResourceStatus.PENDING;
    }
    validate() {
        const errors = [];
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
        if (this.address) {
            errors.push(...this.address.validate());
        }
        if (this.contact) {
            errors.push(...this.contact.validate());
        }
        if (this.seo) {
            errors.push(...this.seo.validate());
        }
        if (this.resourceType === enums_1.ResourceType.BUSINESS) {
            if (!this.address || !this.address.isComplete()) {
                errors.push('Business resources must have a complete address');
            }
            if (!this.contact || !this.contact.hasAnyContact()) {
                errors.push('Business resources must have at least one contact method');
            }
        }
        return errors;
    }
    static generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    regenerateSlug() {
        const newSlug = ApiResourceDomain.generateSlug(this.name);
        return this.withSlug(newSlug);
    }
    withName(name) {
        return new ApiResourceDomain(this.id, this.userId, name, this.slug, this.description, this.resourceType, this.categoryId, this.address, this.contact, this.status, this.plan, this.verified, this.seo, this.createdAt, new Date(), this.publishedAt, this.deletedAt);
    }
    withSlug(slug) {
        return new ApiResourceDomain(this.id, this.userId, this.name, slug, this.description, this.resourceType, this.categoryId, this.address, this.contact, this.status, this.plan, this.verified, this.seo, this.createdAt, new Date(), this.publishedAt, this.deletedAt);
    }
    withStatus(status) {
        const publishedAt = status === enums_1.ResourceStatus.ACTIVE && !this.publishedAt
            ? new Date()
            : this.publishedAt;
        return new ApiResourceDomain(this.id, this.userId, this.name, this.slug, this.description, this.resourceType, this.categoryId, this.address, this.contact, status, this.plan, this.verified, this.seo, this.createdAt, new Date(), publishedAt, this.deletedAt);
    }
    withPlan(plan) {
        return new ApiResourceDomain(this.id, this.userId, this.name, this.slug, this.description, this.resourceType, this.categoryId, this.address, this.contact, this.status, plan, this.verified, this.seo, this.createdAt, new Date(), this.publishedAt, this.deletedAt);
    }
    withVerified(verified) {
        return new ApiResourceDomain(this.id, this.userId, this.name, this.slug, this.description, this.resourceType, this.categoryId, this.address, this.contact, this.status, this.plan, verified, this.seo, this.createdAt, new Date(), this.publishedAt, this.deletedAt);
    }
    markAsDeleted() {
        return new ApiResourceDomain(this.id, this.userId, this.name, this.slug, this.description, this.resourceType, this.categoryId, this.address, this.contact, this.status, this.plan, this.verified, this.seo, this.createdAt, new Date(), this.publishedAt, new Date());
    }
    isValidSlug(slug) {
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        return slugRegex.test(slug);
    }
    equals(other) {
        return this.id === other.id;
    }
    toString() {
        return `ApiResource(${this.id}, ${this.name}, ${this.status})`;
    }
}
exports.ApiResourceDomain = ApiResourceDomain;
//# sourceMappingURL=api-resource-domain.js.map