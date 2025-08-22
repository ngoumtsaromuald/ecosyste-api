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
var SearchAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const crypto = require("crypto");
let SearchAnalyticsService = SearchAnalyticsService_1 = class SearchAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SearchAnalyticsService_1.name);
    }
    async logSearch(params) {
        try {
            const anonymizedIp = this.anonymizeIpAddress(params.ipAddress);
            const searchLog = await this.prisma.searchLog.create({
                data: {
                    query: params.query.trim().toLowerCase(),
                    filters: params.filters,
                    userId: params.userId,
                    sessionId: params.sessionId,
                    userAgent: params.userAgent?.substring(0, 500),
                    ipAddress: anonymizedIp,
                    resultsCount: params.resultsCount,
                    took: params.took,
                },
            });
            this.logger.debug(`Search logged: ${searchLog.id} - Query: "${params.query}" - Results: ${params.resultsCount}`);
            return searchLog.id;
        }
        catch (error) {
            this.logger.error('Failed to log search', error);
            throw error;
        }
    }
    async logClick(searchLogId, resourceId, position, userId) {
        try {
            await this.prisma.searchClick.create({
                data: {
                    searchLogId,
                    resourceId,
                    userId,
                    position,
                },
            });
            this.logger.debug(`Click logged: SearchLog ${searchLogId} - Resource ${resourceId} - Position ${position}`);
        }
        catch (error) {
            this.logger.error('Failed to log click', error);
            throw error;
        }
    }
    async getPopularTerms(period, limit = 50) {
        try {
            const result = await this.prisma.searchLog.groupBy({
                by: ['query'],
                where: {
                    createdAt: {
                        gte: period.from,
                        lte: period.to,
                    },
                    query: {
                        not: '',
                    },
                },
                _count: {
                    query: true,
                },
                orderBy: {
                    _count: {
                        query: 'desc',
                    },
                },
                take: limit,
            });
            const totalSearches = await this.prisma.searchLog.count({
                where: {
                    createdAt: {
                        gte: period.from,
                        lte: period.to,
                    },
                    query: {
                        not: '',
                    },
                },
            });
            return result.map(item => ({
                term: item.query,
                count: item._count.query,
                percentage: totalSearches > 0 ? (item._count.query / totalSearches) * 100 : 0,
            }));
        }
        catch (error) {
            this.logger.error('Failed to get popular terms', error);
            throw error;
        }
    }
    async getNoResultsQueries(period, limit = 50) {
        try {
            const result = await this.prisma.searchLog.groupBy({
                by: ['query'],
                where: {
                    createdAt: {
                        gte: period.from,
                        lte: period.to,
                    },
                    resultsCount: 0,
                    query: {
                        not: '',
                    },
                },
                _count: {
                    query: true,
                },
                _max: {
                    createdAt: true,
                },
                orderBy: {
                    _count: {
                        query: 'desc',
                    },
                },
                take: limit,
            });
            return result.map(item => ({
                query: item.query,
                count: item._count.query,
                lastSearched: item._max.createdAt || new Date(),
            }));
        }
        catch (error) {
            this.logger.error('Failed to get no results queries', error);
            throw error;
        }
    }
    async getSearchMetrics(period) {
        try {
            const [totalSearches, averageResponseTime, popularTerms, noResultsQueries] = await Promise.all([
                this.getTotalSearches(period),
                this.getAverageResponseTime(period),
                this.getPopularTerms(period, 10),
                this.getNoResultsQueries(period, 10),
            ]);
            const clickThroughRate = await this.getClickThroughRate(period);
            return {
                totalSearches,
                averageResponseTime,
                popularTerms,
                noResultsQueries,
                clickThroughRate,
                period,
            };
        }
        catch (error) {
            this.logger.error('Failed to get search metrics', error);
            throw error;
        }
    }
    async getClickStats(resourceId, period) {
        try {
            const [clickStats, searchStats] = await Promise.all([
                this.prisma.searchClick.aggregate({
                    where: {
                        resourceId,
                        createdAt: {
                            gte: period.from,
                            lte: period.to,
                        },
                    },
                    _count: {
                        id: true,
                    },
                    _avg: {
                        position: true,
                    },
                }),
                this.prisma.searchClick.findMany({
                    where: {
                        resourceId,
                        createdAt: {
                            gte: period.from,
                            lte: period.to,
                        },
                    },
                    select: {
                        userId: true,
                        searchLogId: true,
                    },
                    distinct: ['userId'],
                }),
            ]);
            const totalClicks = clickStats._count.id;
            const uniqueUsers = searchStats.length;
            const averagePosition = clickStats._avg.position || 0;
            const searchLogIds = [...new Set(searchStats.map(s => s.searchLogId))];
            const totalSearchesWithResource = searchLogIds.length;
            const clickThroughRate = totalSearchesWithResource > 0 ? (totalClicks / totalSearchesWithResource) * 100 : 0;
            return {
                totalClicks,
                uniqueUsers,
                averagePosition,
                clickThroughRate,
            };
        }
        catch (error) {
            this.logger.error('Failed to get click stats', error);
            throw error;
        }
    }
    async getUserSearchHistory(userId, limit = 100) {
        try {
            const searches = await this.prisma.searchLog.findMany({
                where: {
                    userId,
                },
                select: {
                    query: true,
                    filters: true,
                    createdAt: true,
                    resultsCount: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
            });
            const categoryFilters = searches
                .map(s => s.filters?.categories)
                .filter(Boolean)
                .flat();
            const categoryStats = categoryFilters.reduce((acc, categoryId) => {
                acc[categoryId] = (acc[categoryId] || 0) + 1;
                return acc;
            }, {});
            const topCategoryIds = Object.keys(categoryStats)
                .sort((a, b) => categoryStats[b] - categoryStats[a])
                .slice(0, 10);
            const categories = await this.prisma.category.findMany({
                where: {
                    id: {
                        in: topCategoryIds,
                    },
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            const topCategories = categories.map(cat => ({
                categoryId: cat.id,
                categoryName: cat.name,
                searchCount: categoryStats[cat.id],
            }));
            const termStats = searches
                .map(s => s.query.toLowerCase().trim())
                .filter(q => q.length > 0)
                .reduce((acc, term) => {
                acc[term] = (acc[term] || 0) + 1;
                return acc;
            }, {});
            const topTerms = Object.entries(termStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([term, count]) => ({ term, count: count }));
            return {
                searches,
                topCategories,
                topTerms,
            };
        }
        catch (error) {
            this.logger.error('Failed to get user search history', error);
            throw error;
        }
    }
    async cleanupOldLogs(retentionDays) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            this.logger.log(`Starting cleanup of logs older than ${cutoffDate.toISOString()}`);
            const deletedClicks = await this.prisma.searchClick.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoffDate,
                    },
                },
            });
            const deletedLogs = await this.prisma.searchLog.deleteMany({
                where: {
                    createdAt: {
                        lt: cutoffDate,
                    },
                },
            });
            this.logger.log(`Cleanup completed: ${deletedLogs.count} search logs and ${deletedClicks.count} clicks deleted`);
            return {
                deletedSearchLogs: deletedLogs.count,
                deletedSearchClicks: deletedClicks.count,
            };
        }
        catch (error) {
            this.logger.error('Failed to cleanup old logs', error);
            throw error;
        }
    }
    anonymizeIpAddress(ipAddress) {
        if (!ipAddress)
            return null;
        try {
            if (ipAddress.includes('.')) {
                const parts = ipAddress.split('.');
                if (parts.length === 4) {
                    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
                }
            }
            if (ipAddress.includes(':')) {
                const parts = ipAddress.split(':');
                if (parts.length >= 4) {
                    return `${parts.slice(0, 4).join(':')}::`;
                }
            }
            return crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16);
        }
        catch (error) {
            this.logger.warn('Failed to anonymize IP address', error);
            return null;
        }
    }
    async getTotalSearches(period) {
        return this.prisma.searchLog.count({
            where: {
                createdAt: {
                    gte: period.from,
                    lte: period.to,
                },
            },
        });
    }
    async getAverageResponseTime(period) {
        const result = await this.prisma.searchLog.aggregate({
            where: {
                createdAt: {
                    gte: period.from,
                    lte: period.to,
                },
            },
            _avg: {
                took: true,
            },
        });
        return result._avg.took || 0;
    }
    async getClickThroughRate(period) {
        const [totalSearches, searchesWithClicks] = await Promise.all([
            this.getTotalSearches(period),
            this.prisma.searchLog.count({
                where: {
                    createdAt: {
                        gte: period.from,
                        lte: period.to,
                    },
                    clicks: {
                        some: {},
                    },
                },
            }),
        ]);
        return totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;
    }
};
exports.SearchAnalyticsService = SearchAnalyticsService;
exports.SearchAnalyticsService = SearchAnalyticsService = SearchAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchAnalyticsService);
//# sourceMappingURL=search-analytics.service.js.map