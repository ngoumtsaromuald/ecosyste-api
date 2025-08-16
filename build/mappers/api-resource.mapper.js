"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResourceMapper = void 0;
const models_1 = require("../domain/models");
const dto_1 = require("../dto");
const address_mapper_1 = require("./address.mapper");
const contact_mapper_1 = require("./contact.mapper");
const seo_data_mapper_1 = require("./seo-data.mapper");
const business_hour_mapper_1 = require("./business-hour.mapper");
const resource_image_mapper_1 = require("./resource-image.mapper");
const category_mapper_1 = require("./category.mapper");
class ApiResourceMapper {
    static toDomain(prismaResource) {
        const address = prismaResource.addressLine1 || prismaResource.city
            ? address_mapper_1.AddressMapper.fromPrisma({
                addressLine1: prismaResource.addressLine1,
                addressLine2: prismaResource.addressLine2,
                city: prismaResource.city,
                region: prismaResource.region,
                postalCode: prismaResource.postalCode,
                country: prismaResource.country,
                latitude: prismaResource.latitude,
                longitude: prismaResource.longitude,
            })
            : null;
        const contact = prismaResource.phone || prismaResource.email || prismaResource.website
            ? contact_mapper_1.ContactMapper.fromPrisma({
                phone: prismaResource.phone,
                email: prismaResource.email,
                website: prismaResource.website,
            })
            : null;
        const seo = prismaResource.metaTitle || prismaResource.metaDescription
            ? seo_data_mapper_1.SeoDataMapper.fromPrisma({
                metaTitle: prismaResource.metaTitle,
                metaDescription: prismaResource.metaDescription,
            })
            : null;
        return models_1.ApiResourceDomain.create({
            id: prismaResource.id,
            userId: prismaResource.userId,
            name: prismaResource.name,
            slug: prismaResource.slug,
            description: prismaResource.description,
            resourceType: prismaResource.resourceType,
            categoryId: prismaResource.categoryId,
            address,
            contact,
            status: prismaResource.status,
            plan: prismaResource.plan,
            verified: prismaResource.verified,
            seo,
            createdAt: prismaResource.createdAt,
            updatedAt: prismaResource.updatedAt,
            publishedAt: prismaResource.publishedAt,
            deletedAt: prismaResource.deletedAt,
        });
    }
    static toResponseDto(domain, category, businessHours = [], images = []) {
        const dto = new dto_1.ApiResourceResponseDto();
        dto.id = domain.id;
        dto.userId = domain.userId;
        dto.name = domain.name;
        dto.slug = domain.slug;
        dto.description = domain.description;
        dto.resourceType = domain.resourceType;
        dto.categoryId = domain.categoryId;
        dto.category = category_mapper_1.CategoryMapper.toResponseDto(category);
        dto.address = domain.address ? address_mapper_1.AddressMapper.toDto(domain.address) : undefined;
        dto.contact = domain.contact ? contact_mapper_1.ContactMapper.toDto(domain.contact) : undefined;
        dto.status = domain.status;
        dto.plan = domain.plan;
        dto.verified = domain.verified;
        dto.seo = domain.seo ? seo_data_mapper_1.SeoDataMapper.toDto(domain.seo) : undefined;
        dto.businessHours = business_hour_mapper_1.BusinessHourMapper.toDtoArray(businessHours);
        dto.images = resource_image_mapper_1.ResourceImageMapper.toDtoArray(images);
        dto.createdAt = domain.createdAt;
        dto.updatedAt = domain.updatedAt;
        dto.publishedAt = domain.publishedAt;
        return dto;
    }
    static toResponseDtoFromPrisma(prismaResource) {
        const domain = this.toDomain(prismaResource);
        return this.toResponseDto(domain, prismaResource.category, prismaResource.hours || [], prismaResource.images || []);
    }
    static fromCreateDto(dto, userId) {
        const address = dto.address ? address_mapper_1.AddressMapper.toDomain(dto.address) : null;
        const contact = dto.contact ? contact_mapper_1.ContactMapper.toDomain(dto.contact) : null;
        const seo = dto.seo ? seo_data_mapper_1.SeoDataMapper.toDomain(dto.seo) : null;
        return models_1.ApiResourceDomain.create({
            id: '',
            userId,
            name: dto.name,
            description: dto.description,
            resourceType: dto.resourceType,
            categoryId: dto.categoryId,
            address,
            contact,
            seo,
        });
    }
    static toPrismaCreate(domain) {
        const addressData = domain.address ? address_mapper_1.AddressMapper.toPrisma(domain.address) : {
            addressLine1: null,
            addressLine2: null,
            city: null,
            region: null,
            postalCode: null,
            country: 'CM',
            latitude: null,
            longitude: null,
        };
        const contactData = domain.contact ? contact_mapper_1.ContactMapper.toPrisma(domain.contact) : {
            phone: null,
            email: null,
            website: null,
        };
        const seoData = domain.seo ? seo_data_mapper_1.SeoDataMapper.toPrisma(domain.seo) : {
            metaTitle: null,
            metaDescription: null,
        };
        return {
            userId: domain.userId,
            name: domain.name,
            slug: domain.slug,
            description: domain.description,
            resourceType: domain.resourceType,
            categoryId: domain.categoryId,
            ...addressData,
            ...contactData,
            status: domain.status,
            plan: domain.plan,
            verified: domain.verified,
            ...seoData,
            publishedAt: domain.publishedAt,
        };
    }
    static toPrismaUpdate(domain) {
        const addressData = domain.address ? address_mapper_1.AddressMapper.toPrisma(domain.address) : {
            addressLine1: null,
            addressLine2: null,
            city: null,
            region: null,
            postalCode: null,
            country: 'CM',
            latitude: null,
            longitude: null,
        };
        const contactData = domain.contact ? contact_mapper_1.ContactMapper.toPrisma(domain.contact) : {
            phone: null,
            email: null,
            website: null,
        };
        const seoData = domain.seo ? seo_data_mapper_1.SeoDataMapper.toPrisma(domain.seo) : {
            metaTitle: null,
            metaDescription: null,
        };
        return {
            name: domain.name,
            slug: domain.slug,
            description: domain.description,
            resourceType: domain.resourceType,
            categoryId: domain.categoryId,
            ...addressData,
            ...contactData,
            status: domain.status,
            plan: domain.plan,
            verified: domain.verified,
            ...seoData,
            publishedAt: domain.publishedAt,
            updatedAt: new Date(),
        };
    }
    static applyUpdateDto(domain, dto) {
        let updatedDomain = domain;
        if (dto.name !== undefined) {
            updatedDomain = updatedDomain.withName(dto.name);
        }
        if (dto.status !== undefined) {
            updatedDomain = updatedDomain.withStatus(dto.status);
        }
        if (dto.plan !== undefined) {
            updatedDomain = updatedDomain.withPlan(dto.plan);
        }
        if (dto.verified !== undefined) {
            updatedDomain = updatedDomain.withVerified(dto.verified);
        }
        if (dto.address !== undefined) {
            const address = dto.address ? address_mapper_1.AddressMapper.toDomain(dto.address) : null;
            updatedDomain = new models_1.ApiResourceDomain(updatedDomain.id, updatedDomain.userId, updatedDomain.name, updatedDomain.slug, dto.description !== undefined ? dto.description : updatedDomain.description, dto.resourceType !== undefined ? dto.resourceType : updatedDomain.resourceType, dto.categoryId !== undefined ? dto.categoryId : updatedDomain.categoryId, address, updatedDomain.contact, updatedDomain.status, updatedDomain.plan, updatedDomain.verified, updatedDomain.seo, updatedDomain.createdAt, new Date(), updatedDomain.publishedAt, updatedDomain.deletedAt);
        }
        if (dto.contact !== undefined) {
            const contact = dto.contact ? contact_mapper_1.ContactMapper.toDomain(dto.contact) : null;
            updatedDomain = new models_1.ApiResourceDomain(updatedDomain.id, updatedDomain.userId, updatedDomain.name, updatedDomain.slug, dto.description !== undefined ? dto.description : updatedDomain.description, dto.resourceType !== undefined ? dto.resourceType : updatedDomain.resourceType, dto.categoryId !== undefined ? dto.categoryId : updatedDomain.categoryId, updatedDomain.address, contact, updatedDomain.status, updatedDomain.plan, updatedDomain.verified, updatedDomain.seo, updatedDomain.createdAt, new Date(), updatedDomain.publishedAt, updatedDomain.deletedAt);
        }
        if (dto.seo !== undefined) {
            const seo = dto.seo ? seo_data_mapper_1.SeoDataMapper.toDomain(dto.seo) : null;
            updatedDomain = new models_1.ApiResourceDomain(updatedDomain.id, updatedDomain.userId, updatedDomain.name, updatedDomain.slug, dto.description !== undefined ? dto.description : updatedDomain.description, dto.resourceType !== undefined ? dto.resourceType : updatedDomain.resourceType, dto.categoryId !== undefined ? dto.categoryId : updatedDomain.categoryId, updatedDomain.address, updatedDomain.contact, updatedDomain.status, updatedDomain.plan, updatedDomain.verified, seo, updatedDomain.createdAt, new Date(), updatedDomain.publishedAt, updatedDomain.deletedAt);
        }
        return updatedDomain;
    }
}
exports.ApiResourceMapper = ApiResourceMapper;
//# sourceMappingURL=api-resource.mapper.js.map