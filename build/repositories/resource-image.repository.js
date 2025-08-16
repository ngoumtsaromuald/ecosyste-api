"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceImageRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
let ResourceImageRepository = class ResourceImageRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMany(params) {
        return this.prisma.resourceImage.findMany(params);
    }
    async findById(id, include) {
        return this.prisma.resourceImage.findUnique({
            where: { id },
            include,
        });
    }
    async create(data) {
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
    async update(id, data) {
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
    async delete(id) {
        return this.prisma.resourceImage.delete({
            where: { id },
        });
    }
    async findByResourceId(resourceId) {
        return this.prisma.resourceImage.findMany({
            where: { resourceId },
            orderBy: [
                { isPrimary: 'desc' },
                { orderIndex: 'asc' },
                { createdAt: 'asc' },
            ],
        });
    }
    async getPrimaryImage(resourceId) {
        return this.prisma.resourceImage.findFirst({
            where: {
                resourceId,
                isPrimary: true,
            },
        });
    }
    async getSecondaryImages(resourceId) {
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
    async setPrimaryImage(imageId) {
        const image = await this.findById(imageId);
        if (!image) {
            throw new Error('Image not found');
        }
        await this.clearPrimaryImages(image.resourceId, imageId);
        return this.prisma.resourceImage.update({
            where: { id: imageId },
            data: { isPrimary: true },
        });
    }
    async clearPrimaryImages(resourceId, exceptImageId) {
        const where = {
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
    async reorderImages(resourceId, imageOrders) {
        await Promise.all(imageOrders.map(({ imageId, orderIndex }) => this.prisma.resourceImage.update({
            where: { id: imageId },
            data: { orderIndex },
        })));
        return this.findByResourceId(resourceId);
    }
    async bulkCreate(resourceId, images) {
        const hasPrimary = images.some(img => img.isPrimary);
        if (hasPrimary) {
            await this.clearPrimaryImages(resourceId);
        }
        const createdImages = await Promise.all(images.map((imageData, index) => this.prisma.resourceImage.create({
            data: {
                resourceId,
                ...imageData,
                isPrimary: imageData.isPrimary || false,
                orderIndex: imageData.orderIndex ?? index,
            },
        })));
        return createdImages;
    }
    async deleteByResourceId(resourceId) {
        return this.prisma.resourceImage.deleteMany({
            where: { resourceId },
        });
    }
    async getImageCount(resourceId) {
        return this.prisma.resourceImage.count({
            where: { resourceId },
        });
    }
    async findResourcesWithoutImages() {
        const resourcesWithImages = await this.prisma.resourceImage.findMany({
            select: { resourceId: true },
            distinct: ['resourceId'],
        });
        const resourceIdsWithImages = resourcesWithImages.map(img => img.resourceId);
        return [];
    }
    async findResourcesWithMultipleImages(minCount = 2) {
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
    async findImagesWithResources(limit = 50, offset = 0) {
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
        });
    }
    async searchByAltText(query, limit = 20) {
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
        });
    }
    async getStatistics() {
        const [totalImages, resourcesWithImages, primaryImages, recentImagesCount,] = await Promise.all([
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
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
    validateImageUrl(url) {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        }
        catch {
            return false;
        }
    }
    async getNextOrderIndex(resourceId) {
        const result = await this.prisma.resourceImage.aggregate({
            where: { resourceId },
            _max: {
                orderIndex: true,
            },
        });
        return (result._max.orderIndex || -1) + 1;
    }
    async ensurePrimaryImage(resourceId) {
        const primaryImage = await this.getPrimaryImage(resourceId);
        if (primaryImage) {
            return primaryImage;
        }
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
    async replaceAllImages(resourceId, newImages) {
        await this.deleteByResourceId(resourceId);
        if (newImages.length === 0) {
            return [];
        }
        return this.bulkCreate(resourceId, newImages);
    }
};
exports.ResourceImageRepository = ResourceImageRepository;
exports.ResourceImageRepository = ResourceImageRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourceImageRepository);
//# sourceMappingURL=resource-image.repository.js.map