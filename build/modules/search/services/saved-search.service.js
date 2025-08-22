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
var SavedSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
let SavedSearchService = SavedSearchService_1 = class SavedSearchService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SavedSearchService_1.name);
    }
    async createSavedSearch(userId, data) {
        try {
            this.logger.debug(`Creating saved search for user ${userId}: ${data.name}`);
            this.validateSavedSearchData(data);
            const existingSearch = await this.prisma.savedSearch.findFirst({
                where: {
                    userId,
                    name: data.name
                }
            });
            if (existingSearch) {
                throw new Error(`A saved search with name "${data.name}" already exists`);
            }
            const savedSearch = await this.prisma.savedSearch.create({
                data: {
                    userId,
                    name: data.name.trim(),
                    query: data.query.trim(),
                    filters: data.filters,
                    isPublic: data.isPublic || false
                }
            });
            this.logger.debug(`Created saved search: ${savedSearch.id}`);
            return this.transformSavedSearch(savedSearch);
        }
        catch (error) {
            this.logger.error(`Failed to create saved search: ${error.message}`);
            throw error;
        }
    }
    async getUserSavedSearches(userId, page = 1, limit = 20) {
        try {
            this.logger.debug(`Getting saved searches for user ${userId}, page ${page}`);
            const offset = (page - 1) * limit;
            const [searches, total] = await Promise.all([
                this.prisma.savedSearch.findMany({
                    where: { userId },
                    orderBy: { updatedAt: 'desc' },
                    skip: offset,
                    take: limit
                }),
                this.prisma.savedSearch.count({
                    where: { userId }
                })
            ]);
            const transformedSearches = searches.map(search => this.transformSavedSearch(search));
            return {
                searches: transformedSearches,
                total,
                page,
                limit,
                hasMore: offset + searches.length < total
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user saved searches: ${error.message}`);
            throw error;
        }
    }
    async getSavedSearchById(userId, searchId) {
        try {
            this.logger.debug(`Getting saved search ${searchId} for user ${userId}`);
            const savedSearch = await this.prisma.savedSearch.findFirst({
                where: {
                    id: searchId,
                    OR: [
                        { userId },
                        { isPublic: true }
                    ]
                }
            });
            if (!savedSearch) {
                throw new common_1.NotFoundException(`Saved search with ID ${searchId} not found`);
            }
            return this.transformSavedSearch(savedSearch);
        }
        catch (error) {
            this.logger.error(`Failed to get saved search: ${error.message}`);
            throw error;
        }
    }
    async updateSavedSearch(userId, searchId, data) {
        try {
            this.logger.debug(`Updating saved search ${searchId} for user ${userId}`);
            const existingSearch = await this.prisma.savedSearch.findFirst({
                where: {
                    id: searchId,
                    userId
                }
            });
            if (!existingSearch) {
                throw new common_1.NotFoundException(`Saved search with ID ${searchId} not found`);
            }
            if (data.name !== undefined || data.query !== undefined || data.filters !== undefined) {
                this.validateSavedSearchData({
                    name: data.name || existingSearch.name,
                    query: data.query || existingSearch.query,
                    filters: data.filters || existingSearch.filters
                });
            }
            if (data.name && data.name !== existingSearch.name) {
                const nameConflict = await this.prisma.savedSearch.findFirst({
                    where: {
                        userId,
                        name: data.name,
                        id: { not: searchId }
                    }
                });
                if (nameConflict) {
                    throw new Error(`A saved search with name "${data.name}" already exists`);
                }
            }
            const updatedSearch = await this.prisma.savedSearch.update({
                where: { id: searchId },
                data: {
                    ...(data.name && { name: data.name.trim() }),
                    ...(data.query && { query: data.query.trim() }),
                    ...(data.filters && { filters: data.filters }),
                    ...(data.isPublic !== undefined && { isPublic: data.isPublic })
                }
            });
            this.logger.debug(`Updated saved search: ${updatedSearch.id}`);
            return this.transformSavedSearch(updatedSearch);
        }
        catch (error) {
            this.logger.error(`Failed to update saved search: ${error.message}`);
            throw error;
        }
    }
    async deleteSavedSearch(userId, searchId) {
        try {
            this.logger.debug(`Deleting saved search ${searchId} for user ${userId}`);
            const existingSearch = await this.prisma.savedSearch.findFirst({
                where: {
                    id: searchId,
                    userId
                }
            });
            if (!existingSearch) {
                throw new common_1.NotFoundException(`Saved search with ID ${searchId} not found`);
            }
            await this.prisma.savedSearch.delete({
                where: { id: searchId }
            });
            this.logger.debug(`Deleted saved search: ${searchId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete saved search: ${error.message}`);
            throw error;
        }
    }
    async getPopularPublicSearches(limit = 10) {
        try {
            this.logger.debug(`Getting popular public searches, limit: ${limit}`);
            const searches = await this.prisma.savedSearch.findMany({
                where: { isPublic: true },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return searches.map(search => this.transformSavedSearch(search));
        }
        catch (error) {
            this.logger.error(`Failed to get popular public searches: ${error.message}`);
            throw error;
        }
    }
    async convertToSearchParams(userId, searchId) {
        try {
            const savedSearch = await this.getSavedSearchById(userId, searchId);
            return {
                query: savedSearch.query,
                filters: savedSearch.filters,
                userId
            };
        }
        catch (error) {
            this.logger.error(`Failed to convert saved search to params: ${error.message}`);
            throw error;
        }
    }
    async duplicateSavedSearch(userId, searchId, newName) {
        try {
            this.logger.debug(`Duplicating saved search ${searchId} for user ${userId}`);
            const originalSearch = await this.getSavedSearchById(userId, searchId);
            const duplicateName = newName || `${originalSearch.name} (Copy)`;
            const duplicateData = {
                name: duplicateName,
                query: originalSearch.query,
                filters: originalSearch.filters,
                isPublic: false
            };
            return await this.createSavedSearch(userId, duplicateData);
        }
        catch (error) {
            this.logger.error(`Failed to duplicate saved search: ${error.message}`);
            throw error;
        }
    }
    async getUserSavedSearchStats(userId) {
        try {
            this.logger.debug(`Getting saved search stats for user ${userId}`);
            const [totalSearches, publicSearches, searches] = await Promise.all([
                this.prisma.savedSearch.count({ where: { userId } }),
                this.prisma.savedSearch.count({ where: { userId, isPublic: true } }),
                this.prisma.savedSearch.findMany({
                    where: { userId },
                    select: { filters: true, updatedAt: true },
                    orderBy: { updatedAt: 'desc' }
                })
            ]);
            const categoryStats = {};
            searches.forEach(search => {
                const filters = search.filters;
                if (filters.categories && Array.isArray(filters.categories)) {
                    filters.categories.forEach((categoryId) => {
                        categoryStats[categoryId] = (categoryStats[categoryId] || 0) + 1;
                    });
                }
            });
            const mostUsedCategories = Object.entries(categoryStats)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            const recentActivity = searches.length > 0 ? searches[0].updatedAt : null;
            return {
                totalSearches,
                publicSearches,
                privateSearches: totalSearches - publicSearches,
                mostUsedCategories,
                recentActivity
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user saved search stats: ${error.message}`);
            throw error;
        }
    }
    validateSavedSearchData(data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Search name is required');
        }
        if (data.name.trim().length > 100) {
            throw new Error('Search name must be less than 100 characters');
        }
        if (!data.query || data.query.trim().length === 0) {
            throw new Error('Search query is required');
        }
        if (data.query.trim().length > 500) {
            throw new Error('Search query must be less than 500 characters');
        }
        if (!data.filters) {
            throw new Error('Search filters are required');
        }
    }
    transformSavedSearch(search) {
        return {
            id: search.id,
            name: search.name,
            query: search.query,
            filters: search.filters,
            isPublic: search.isPublic,
            createdAt: search.createdAt,
            updatedAt: search.updatedAt,
            userId: search.userId
        };
    }
};
exports.SavedSearchService = SavedSearchService;
exports.SavedSearchService = SavedSearchService = SavedSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SavedSearchService);
//# sourceMappingURL=saved-search.service.js.map