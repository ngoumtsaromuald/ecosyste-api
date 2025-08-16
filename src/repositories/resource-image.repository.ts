import { Injectable } from '@nestjs/common';
import { Prisma, ResourceImage } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';

export interface ResourceImageFindManyParams {
  where?: Prisma.ResourceImageWhereInput;
  include?: Prisma.ResourceImageInclude;
  orderBy?: Prisma.ResourceImageOrderByWithRelationInput | Prisma.ResourceImageOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface CreateResourceImageData {
  resourceId: string;
  url: string;
  altText?: string | null;
  isPrimary?: boolean;
  orderIndex?: number;
}

export interface UpdateResourceImageData {
  url?: string;
  altText?: string | null;
  isPrimary?: boolean;
  orderIndex?: number;
}

export interface ResourceImageWithResource extends ResourceImage {
  resource?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ImageUploadResult {
  id: string;
  url: string;
  isPrimary: boolean;
  orderIndex: number;
}

@Injectable()
export class ResourceImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find multiple resource images with optional filters
   */
  async findMany(params: ResourceImageFindManyParams): Promise<ResourceImage[]> {
    return this.prisma.resourceImage.findMany(params);
  }

  /**
   * Find resource image by ID
   */
  async findById(id: string, include?: Prisma.ResourceImageInclude): Promise<ResourceImage | null> {
    return this.prisma.resourceImage.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Create a new resource image
   */
  async create(data: CreateResourceImageData): Promise<ResourceImage> {
    // If this is set as primary, ensure no other image is primary for this resource
    if (data.isPrimary) {
      await this.clearPrimaryImages(data.resourceId);
    }

    return this.prisma.resourceImage.create({
      data: {
        ...data,
        isPrimary: data.isPrimary || false,
        orderIndex: data.orderIndex || 0,
      },
    });
  }

  /**
   * Update an existing resource image
   */
  async update(id: string, data: UpdateResourceImageData): Promise<ResourceImage> {
    // If setting as primary, clear other primary images for the same resource
    if (data.isPrimary) {
      const image = await this.findById(id);
      if (image) {
        await this.clearPrimaryImages(image.resourceId, id);
      }
    }

    return this.prisma.resourceImage.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a resource image
   */
  async delete(id: string): Promise<ResourceImage> {
    return this.prisma.resourceImage.delete({
      where: { id },
    });
  }

  /**
   * Find all images for a specific resource
   */
  async findByResourceId(resourceId: string): Promise<ResourceImage[]> {
    return this.prisma.resourceImage.findMany({
      where: { resourceId },
      orderBy: [
        { isPrimary: 'desc' }, // Primary image first
        { orderIndex: 'asc' }, // Then by order index
        { createdAt: 'asc' }, // Then by creation date
      ],
    });
  }

  /**
   * Get primary image for a resource
   */
  async getPrimaryImage(resourceId: string): Promise<ResourceImage | null> {
    return this.prisma.resourceImage.findFirst({
      where: {
        resourceId,
        isPrimary: true,
      },
    });
  }

  /**
   * Get all non-primary images for a resource
   */
  async getSecondaryImages(resourceId: string): Promise<ResourceImage[]> {
    return this.prisma.resourceImage.findMany({
      where: {
        resourceId,
        isPrimary: false,
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Set an image as primary (and unset others)
   */
  async setPrimaryImage(imageId: string): Promise<ResourceImage> {
    const image = await this.findById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    // Clear other primary images for this resource
    await this.clearPrimaryImages(image.resourceId, imageId);

    // Set this image as primary
    return this.prisma.resourceImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  /**
   * Clear primary flag from all images of a resource (except optionally one)
   */
  async clearPrimaryImages(resourceId: string, exceptImageId?: string): Promise<Prisma.BatchPayload> {
    const where: Prisma.ResourceImageWhereInput = {
      resourceId,
      isPrimary: true,
    };

    if (exceptImageId) {
      where.id = { not: exceptImageId };
    }

    return this.prisma.resourceImage.updateMany({
      where,
      data: { isPrimary: false },
    });
  }

  /**
   * Reorder images for a resource
   */
  async reorderImages(
    resourceId: string,
    imageOrders: { imageId: string; orderIndex: number }[],
  ): Promise<ResourceImage[]> {
    // Update each image's order index
    await Promise.all(
      imageOrders.map(({ imageId, orderIndex }) =>
        this.prisma.resourceImage.update({
          where: { id: imageId },
          data: { orderIndex },
        }),
      ),
    );

    // Return updated images
    return this.findByResourceId(resourceId);
  }

  /**
   * Bulk create images for a resource
   */
  async bulkCreate(
    resourceId: string,
    images: Omit<CreateResourceImageData, 'resourceId'>[],
  ): Promise<ResourceImage[]> {
    // Check if any image is marked as primary
    const hasPrimary = images.some(img => img.isPrimary);
    
    if (hasPrimary) {
      // Clear existing primary images
      await this.clearPrimaryImages(resourceId);
    }

    // Create all images
    const createdImages = await Promise.all(
      images.map((imageData, index) =>
        this.prisma.resourceImage.create({
          data: {
            resourceId,
            ...imageData,
            isPrimary: imageData.isPrimary || false,
            orderIndex: imageData.orderIndex ?? index,
          },
        }),
      ),
    );

    return createdImages;
  }

  /**
   * Delete all images for a resource
   */
  async deleteByResourceId(resourceId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.resourceImage.deleteMany({
      where: { resourceId },
    });
  }

  /**
   * Get image count for a resource
   */
  async getImageCount(resourceId: string): Promise<number> {
    return this.prisma.resourceImage.count({
      where: { resourceId },
    });
  }

  /**
   * Find resources with no images
   */
  async findResourcesWithoutImages(): Promise<string[]> {
    const resourcesWithImages = await this.prisma.resourceImage.findMany({
      select: { resourceId: true },
      distinct: ['resourceId'],
    });

    const resourceIdsWithImages = resourcesWithImages.map(img => img.resourceId);

    // This would need to be combined with ApiResourceRepository to get all resource IDs
    // For now, return empty array as this method would typically be used differently
    return [];
  }

  /**
   * Find resources with multiple images
   */
  async findResourcesWithMultipleImages(minCount: number = 2): Promise<{
    resourceId: string;
    imageCount: number;
  }[]> {
    const result = await this.prisma.resourceImage.groupBy({
      by: ['resourceId'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: minCount,
          },
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return result.map(item => ({
      resourceId: item.resourceId,
      imageCount: item._count.id,
    }));
  }

  /**
   * Get images with their resource information
   */
  async findImagesWithResources(
    limit: number = 50,
    offset: number = 0,
  ): Promise<ResourceImageWithResource[]> {
    return this.prisma.resourceImage.findMany({
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }) as Promise<ResourceImageWithResource[]>;
  }

  /**
   * Search images by alt text
   */
  async searchByAltText(query: string, limit: number = 20): Promise<ResourceImageWithResource[]> {
    return this.prisma.resourceImage.findMany({
      where: {
        altText: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<ResourceImageWithResource[]>;
  }

  /**
   * Get image statistics
   */
  async getStatistics(): Promise<{
    totalImages: number;
    resourcesWithImages: number;
    primaryImages: number;
    avgImagesPerResource: number;
    recentImagesCount: number;
  }> {
    const [
      totalImages,
      resourcesWithImages,
      primaryImages,
      recentImagesCount,
    ] = await Promise.all([
      this.prisma.resourceImage.count(),
      this.prisma.resourceImage.groupBy({
        by: ['resourceId'],
        _count: true,
      }),
      this.prisma.resourceImage.count({
        where: { isPrimary: true },
      }),
      this.prisma.resourceImage.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    const avgImagesPerResource = resourcesWithImages.length > 0
      ? totalImages / resourcesWithImages.length
      : 0;

    return {
      totalImages,
      resourcesWithImages: resourcesWithImages.length,
      primaryImages,
      avgImagesPerResource: Math.round(avgImagesPerResource * 100) / 100,
      recentImagesCount,
    };
  }

  /**
   * Validate image URL format
   */
  validateImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Get next order index for a resource
   */
  async getNextOrderIndex(resourceId: string): Promise<number> {
    const result = await this.prisma.resourceImage.aggregate({
      where: { resourceId },
      _max: {
        orderIndex: true,
      },
    });

    return (result._max.orderIndex || -1) + 1;
  }

  /**
   * Ensure resource has a primary image
   */
  async ensurePrimaryImage(resourceId: string): Promise<ResourceImage | null> {
    // Check if there's already a primary image
    const primaryImage = await this.getPrimaryImage(resourceId);
    if (primaryImage) {
      return primaryImage;
    }

    // If no primary image, set the first image as primary
    const firstImage = await this.prisma.resourceImage.findFirst({
      where: { resourceId },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (firstImage) {
      return this.setPrimaryImage(firstImage.id);
    }

    return null;
  }

  /**
   * Replace all images for a resource
   */
  async replaceAllImages(
    resourceId: string,
    newImages: Omit<CreateResourceImageData, 'resourceId'>[],
  ): Promise<ResourceImage[]> {
    // Delete existing images
    await this.deleteByResourceId(resourceId);

    // Create new images
    if (newImages.length === 0) {
      return [];
    }

    return this.bulkCreate(resourceId, newImages);
  }
}