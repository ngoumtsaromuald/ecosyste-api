import { ApiResourceMapper } from '../api-resource.mapper';
import { ApiResourceDomain } from '../../domain/models';
import { ResourceType, ResourceStatus, ResourcePlan } from '../../domain/enums';
import { Address, Contact, SeoData } from '../../domain/value-objects';
import { CreateApiResourceDto } from '../../dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('ApiResourceMapper', () => {
  const mockCategory = {
    id: 'cat-123',
    name: 'Restaurants',
    slug: 'restaurants',
    description: 'Food establishments',
    icon: 'restaurant',
    parentId: null,
    createdAt: new Date('2024-01-01'),
  };

  const mockAddress = Address.create({
    addressLine1: '123 Main St',
    city: 'Yaoundé',
    country: 'CM',
    latitude: new Decimal(3.848),
    longitude: new Decimal(11.502),
  });

  const mockContact = Contact.create({
    phone: '+237123456789',
    email: 'test@example.com',
    website: 'https://example.com',
  });

  const mockSeo = SeoData.create({
    metaTitle: 'Test Restaurant',
    metaDescription: 'A great restaurant in Yaoundé',
  });

  describe('fromCreateDto', () => {
    it('should convert CreateApiResourceDto to domain model', () => {
      const dto: CreateApiResourceDto = {
        name: 'Test Restaurant',
        description: 'A great restaurant',
        resourceType: ResourceType.BUSINESS,
        categoryId: 'cat-123',
        address: {
          addressLine1: '123 Main St',
          city: 'Yaoundé',
          country: 'CM',
          latitude: 3.848,
          longitude: 11.502,
        },
        contact: {
          phone: '+237123456789',
          email: 'test@example.com',
          website: 'https://example.com',
        },
        seo: {
          metaTitle: 'Test Restaurant',
          metaDescription: 'A great restaurant in Yaoundé',
        },
      };

      const result = ApiResourceMapper.fromCreateDto(dto, 'user-123');

      expect(result.name).toBe('Test Restaurant');
      expect(result.description).toBe('A great restaurant');
      expect(result.resourceType).toBe(ResourceType.BUSINESS);
      expect(result.categoryId).toBe('cat-123');
      expect(result.userId).toBe('user-123');
      expect(result.address?.addressLine1).toBe('123 Main St');
      expect(result.contact?.phone).toBe('+237123456789');
      expect(result.seo?.metaTitle).toBe('Test Restaurant');
    });
  });

  describe('toResponseDto', () => {
    it('should convert domain model to response DTO', () => {
      const domain = ApiResourceDomain.create({
        id: 'resource-123',
        userId: 'user-123',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        description: 'A great restaurant',
        resourceType: ResourceType.BUSINESS,
        categoryId: 'cat-123',
        address: mockAddress,
        contact: mockContact,
        seo: mockSeo,
        status: ResourceStatus.ACTIVE,
        plan: ResourcePlan.FREE,
        verified: true,
      });

      const result = ApiResourceMapper.toResponseDto(domain, mockCategory);

      expect(result.id).toBe('resource-123');
      expect(result.name).toBe('Test Restaurant');
      expect(result.slug).toBe('test-restaurant');
      expect(result.resourceType).toBe(ResourceType.BUSINESS);
      expect(result.status).toBe(ResourceStatus.ACTIVE);
      expect(result.verified).toBe(true);
      expect(result.category.name).toBe('Restaurants');
      expect(result.address?.addressLine1).toBe('123 Main St');
      expect(result.contact?.phone).toBe('+237123456789');
      expect(result.seo?.metaTitle).toBe('Test Restaurant');
    });
  });

  describe('toPrismaCreate', () => {
    it('should convert domain model to Prisma create data', () => {
      const domain = ApiResourceDomain.create({
        id: 'resource-123',
        userId: 'user-123',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        description: 'A great restaurant',
        resourceType: ResourceType.BUSINESS,
        categoryId: 'cat-123',
        address: mockAddress,
        contact: mockContact,
        seo: mockSeo,
      });

      const result = ApiResourceMapper.toPrismaCreate(domain);

      expect(result.userId).toBe('user-123');
      expect(result.name).toBe('Test Restaurant');
      expect(result.slug).toBe('test-restaurant');
      expect(result.resourceType).toBe(ResourceType.BUSINESS);
      expect(result.addressLine1).toBe('123 Main St');
      expect(result.phone).toBe('+237123456789');
      expect(result.metaTitle).toBe('Test Restaurant');
      expect(result.latitude?.toNumber()).toBe(3.848);
    });
  });

  describe('slug generation', () => {
    it('should generate valid slug from name', () => {
      const slug = ApiResourceDomain.generateSlug('Restaurant Le Palais & Café');
      expect(slug).toBe('restaurant-le-palais-cafe');
    });

    it('should handle special characters and accents', () => {
      const slug = ApiResourceDomain.generateSlug('Café Français à Yaoundé');
      expect(slug).toBe('cafe-francais-a-yaounde');
    });
  });
});