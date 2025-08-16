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
exports.BusinessHourRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../config/prisma.service");
let BusinessHourRepository = class BusinessHourRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMany(params) {
        return this.prisma.businessHour.findMany(params);
    }
    async findById(id, include) {
        return this.prisma.businessHour.findUnique({
            where: { id },
            include,
        });
    }
    async create(data) {
        return this.prisma.businessHour.create({
            data: {
                ...data,
                isClosed: data.isClosed || false,
            },
        });
    }
    async update(id, data) {
        return this.prisma.businessHour.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return this.prisma.businessHour.delete({
            where: { id },
        });
    }
    async findByResourceId(resourceId) {
        return this.prisma.businessHour.findMany({
            where: { resourceId },
            orderBy: { dayOfWeek: 'asc' },
        });
    }
    async getWeeklySchedule(resourceId) {
        const businessHours = await this.findByResourceId(resourceId);
        const schedule = {};
        for (let day = 0; day <= 6; day++) {
            schedule[day] = null;
        }
        businessHours.forEach(hour => {
            schedule[hour.dayOfWeek] = hour;
        });
        return schedule;
    }
    async findByDayOfWeek(dayOfWeek, resourceId) {
        const where = { dayOfWeek };
        if (resourceId) {
            where.resourceId = resourceId;
        }
        return this.prisma.businessHour.findMany({
            where,
            include: {
                resource: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: { openTime: 'asc' },
        });
    }
    async findResourcesOpenAt(dayOfWeek, time) {
        return this.prisma.businessHour.findMany({
            where: {
                dayOfWeek,
                isClosed: false,
                openTime: {
                    lte: time,
                },
                closeTime: {
                    gte: time,
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
            orderBy: { openTime: 'asc' },
        });
    }
    async findResourcesCurrentlyOpen() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5);
        return this.findResourcesOpenAt(dayOfWeek, currentTime);
    }
    async setWeeklySchedule(resourceId, schedule) {
        await this.prisma.businessHour.deleteMany({
            where: { resourceId },
        });
        if (schedule.length === 0) {
            return [];
        }
        const createdHours = await this.prisma.businessHour.createMany({
            data: schedule.map(hour => ({
                ...hour,
                resourceId,
                isClosed: hour.isClosed || false,
            })),
        });
        return this.findByResourceId(resourceId);
    }
    async upsertBusinessHour(resourceId, dayOfWeek, data) {
        const existing = await this.prisma.businessHour.findFirst({
            where: {
                resourceId,
                dayOfWeek,
            },
        });
        if (existing) {
            return this.prisma.businessHour.update({
                where: { id: existing.id },
                data,
            });
        }
        else {
            return this.prisma.businessHour.create({
                data: {
                    resourceId,
                    dayOfWeek,
                    ...data,
                    isClosed: data.isClosed || false,
                },
            });
        }
    }
    async deleteByResourceId(resourceId) {
        return this.prisma.businessHour.deleteMany({
            where: { resourceId },
        });
    }
    async find24x7Resources() {
        const resourcesWithAllDays = await this.prisma.businessHour.groupBy({
            by: ['resourceId'],
            where: {
                isClosed: false,
                openTime: '00:00',
                closeTime: '23:59',
            },
            having: {
                resourceId: {
                    _count: {
                        equals: 7,
                    },
                },
            },
        });
        const resourceIds = resourcesWithAllDays.map(group => group.resourceId);
        return this.prisma.businessHour.findMany({
            where: {
                resourceId: {
                    in: resourceIds,
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
            orderBy: [
                { resourceId: 'asc' },
                { dayOfWeek: 'asc' },
            ],
        });
    }
    async findResourcesClosedOn(dayOfWeek) {
        return this.prisma.businessHour.findMany({
            where: {
                dayOfWeek,
                isClosed: true,
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
        });
    }
    async getStatistics() {
        const [totalBusinessHours, resourcesWithHours, openTimeStats, closeTimeStats, resources24x7,] = await Promise.all([
            this.prisma.businessHour.count(),
            this.prisma.businessHour.groupBy({
                by: ['resourceId'],
                _count: true,
            }),
            this.prisma.businessHour.groupBy({
                by: ['openTime'],
                where: {
                    isClosed: false,
                    openTime: { not: null },
                },
                _count: true,
                orderBy: {
                    _count: {
                        openTime: 'desc',
                    },
                },
                take: 1,
            }),
            this.prisma.businessHour.groupBy({
                by: ['closeTime'],
                where: {
                    isClosed: false,
                    closeTime: { not: null },
                },
                _count: true,
                orderBy: {
                    _count: {
                        closeTime: 'desc',
                    },
                },
                take: 1,
            }),
            this.find24x7Resources(),
        ]);
        const avgHoursPerResource = resourcesWithHours.length > 0
            ? totalBusinessHours / resourcesWithHours.length
            : 0;
        const unique24x7Resources = new Set(resources24x7.map(r => r.resourceId)).size;
        return {
            totalBusinessHours,
            resourcesWithHours: resourcesWithHours.length,
            avgHoursPerResource: Math.round(avgHoursPerResource * 100) / 100,
            mostCommonOpenTime: openTimeStats[0]?.openTime || null,
            mostCommonCloseTime: closeTimeStats[0]?.closeTime || null,
            resourcesOpen24x7: unique24x7Resources,
        };
    }
    validateTimeFormat(time) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    validateBusinessHours(openTime, closeTime) {
        if (!this.validateTimeFormat(openTime) || !this.validateTimeFormat(closeTime)) {
            return false;
        }
        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);
        const openMinutes = openHour * 60 + openMinute;
        const closeMinutes = closeHour * 60 + closeMinute;
        return true;
    }
    async getNextOpeningTime(resourceId) {
        const schedule = await this.getWeeklySchedule(resourceId);
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5);
        const todayHours = schedule[currentDay];
        if (todayHours && !todayHours.isClosed && todayHours.openTime && todayHours.closeTime) {
            if (currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime) {
                return null;
            }
        }
        for (let i = 0; i < 7; i++) {
            const checkDay = (currentDay + i) % 7;
            const dayHours = schedule[checkDay];
            if (dayHours && !dayHours.isClosed && dayHours.openTime) {
                if (i === 0 && currentTime >= dayHours.openTime) {
                    continue;
                }
                return {
                    dayOfWeek: checkDay,
                    openTime: dayHours.openTime,
                    daysUntilOpen: i,
                };
            }
        }
        return null;
    }
};
exports.BusinessHourRepository = BusinessHourRepository;
exports.BusinessHourRepository = BusinessHourRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessHourRepository);
//# sourceMappingURL=business-hour.repository.js.map