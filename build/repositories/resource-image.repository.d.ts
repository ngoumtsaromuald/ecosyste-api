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
export declare class ResourceImageRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: ResourceImageFindManyParams): Promise<ResourceImage[]>;
    findById(id: string, include?: Prisma.ResourceImageInclude): Promise<ResourceImage | null>;
    create(data: CreateResourceImageData): Promise<ResourceImage>;
    update(id: string, data: UpdateResourceImageData): Promise<ResourceImage>;
    delete(id: string): Promise<ResourceImage>;
    findByResourceId(resourceId: string): Promise<ResourceImage[]>;
    getPrimaryImage(resourceId: string): Promise<ResourceImage | null>;
    getSecondaryImages(resourceId: string): Promise<ResourceImage[]>;
    setPrimaryImage(imageId: string): Promise<ResourceImage>;
    clearPrimaryImages(resourceId: string, exceptImageId?: string): Promise<Prisma.BatchPayload>;
    reorderImages(resourceId: string, imageOrders: {
        imageId: string;
        orderIndex: number;
    }[]): Promise<ResourceImage[]>;
    bulkCreate(resourceId: string, images: Omit<CreateResourceImageData, 'resourceId'>[]): Promise<ResourceImage[]>;
    deleteByResourceId(resourceId: string): Promise<Prisma.BatchPayload>;
    getImageCount(resourceId: string): Promise<number>;
    findResourcesWithoutImages(): Promise<string[]>;
    findResourcesWithMultipleImages(minCount?: number): Promise<{
        resourceId: string;
        imageCount: number;
    }[]>;
    findImagesWithResources(limit?: number, offset?: number): Promise<ResourceImageWithResource[]>;
    searchByAltText(query: string, limit?: number): Promise<ResourceImageWithResource[]>;
    getStatistics(): Promise<{
        totalImages: number;
        resourcesWithImages: number;
        primaryImages: number;
        avgImagesPerResource: number;
        recentImagesCount: number;
    }>;
    validateImageUrl(url: string): boolean;
    getNextOrderIndex(resourceId: string): Promise<number>;
    ensurePrimaryImage(resourceId: string): Promise<ResourceImage | null>;
    replaceAllImages(resourceId: string, newImages: Omit<CreateResourceImageData, 'resourceId'>[]): Promise<ResourceImage[]>;
}
