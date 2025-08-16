import { Injectable } from '@nestjs/common';
import { Prisma, BusinessHour } from '@prisma/client';
import { PrismaService } from '../config/prisma.service';

export interface BusinessHourFindManyParams {
  where?: Prisma.BusinessHourWhereInput;
  include?: Prisma.BusinessHourInclude;
  orderBy?: Prisma.BusinessHourOrderByWithRelationInput | Prisma.BusinessHourOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface CreateBusinessHourData {
  resourceId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime?: string | null; // Format: "HH:MM" (24-hour format)
  closeTime?: string | null; // Format: "HH:MM" (24-hour format)
  isClosed?: boolean;
}

export interface UpdateBusinessHourData {
  dayOfWeek?: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed?: boolean;
}

export interface BusinessHourWithResource extends BusinessHour {
  resource?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface WeeklySchedule {
  [dayOfWeek: number]: BusinessHour | null;
}

@Injectable()
export class BusinessHourRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find multiple business hours with optional filters
   */
  async findMany(params: BusinessHourFindManyParams): Promise<BusinessHour[]> {
    return this.prisma.businessHour.findMany(params);
  }

  /**
   * Find business hour by ID
   */
  async findById(id: string, include?: Prisma.BusinessHourInclude): Promise<BusinessHour | null> {
    return this.prisma.businessHour.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Create a new business hour
   */
  async create(data: CreateBusinessHourData): Promise<BusinessHour> {
    return this.prisma.businessHour.create({
      data: {
        ...data,
        isClosed: data.isClosed || false,
      },
    });
  }

  /**
   * Update an existing business hour
   */
  async update(id: string, data: UpdateBusinessHourData): Promise<BusinessHour> {
    return this.prisma.businessHour.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a business hour
   */
  async delete(id: string): Promise<BusinessHour> {
    return this.prisma.businessHour.delete({
      where: { id },
    });
  }

  /**
   * Find all business hours for a specific resource
   */
  async findByResourceId(resourceId: string): Promise<BusinessHour[]> {
    return this.prisma.businessHour.findMany({
      where: { resourceId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  /**
   * Get weekly schedule for a resource
   */
  async getWeeklySchedule(resourceId: string): Promise<WeeklySchedule> {
    const businessHours = await this.findByResourceId(resourceId);
    
    const schedule: WeeklySchedule = {};
    
    // Initialize all days as null
    for (let day = 0; day <= 6; day++) {
      schedule[day] = null;
    }
    
    // Fill in the actual business hours
    businessHours.forEach(hour => {
      schedule[hour.dayOfWeek] = hour;
    });
    
    return schedule;
  }

  /**
   * Find business hours for a specific day of the week
   */
  async findByDayOfWeek(
    dayOfWeek: number,
    resourceId?: string,
  ): Promise<BusinessHourWithResource[]> {
    const where: Prisma.BusinessHourWhereInput = { dayOfWeek };
    
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
    }) as Promise<BusinessHourWithResource[]>;
  }

  /**
   * Find resources that are open at a specific time
   */
  async findResourcesOpenAt(
    dayOfWeek: number,
    time: string, // Format: "HH:MM"
  ): Promise<BusinessHourWithResource[]> {
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
    }) as Promise<BusinessHourWithResource[]>;
  }

  /**
   * Find resources that are currently open
   */
  async findResourcesCurrentlyOpen(): Promise<BusinessHourWithResource[]> {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format

    return this.findResourcesOpenAt(dayOfWeek, currentTime);
  }

  /**
   * Set complete weekly schedule for a resource
   */
  async setWeeklySchedule(
    resourceId: string,
    schedule: CreateBusinessHourData[],
  ): Promise<BusinessHour[]> {
    // Delete existing business hours for this resource
    await this.prisma.businessHour.deleteMany({
      where: { resourceId },
    });

    // Create new business hours
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

    // Return the created business hours
    return this.findByResourceId(resourceId);
  }

  /**
   * Update or create business hour for a specific day
   */
  async upsertBusinessHour(
    resourceId: string,
    dayOfWeek: number,
    data: Omit<CreateBusinessHourData, 'resourceId' | 'dayOfWeek'>,
  ): Promise<BusinessHour> {
    // First try to find existing business hour
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
    } else {
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

  /**
   * Delete all business hours for a resource
   */
  async deleteByResourceId(resourceId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.businessHour.deleteMany({
      where: { resourceId },
    });
  }

  /**
   * Find resources with 24/7 availability
   */
  async find24x7Resources(): Promise<BusinessHourWithResource[]> {
    // Find resources that have business hours for all 7 days and are not closed
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
            equals: 7, // All 7 days of the week
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
    }) as Promise<BusinessHourWithResource[]>;
  }

  /**
   * Find resources that are closed on a specific day
   */
  async findResourcesClosedOn(dayOfWeek: number): Promise<BusinessHourWithResource[]> {
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
    }) as Promise<BusinessHourWithResource[]>;
  }

  /**
   * Get business hours statistics
   */
  async getStatistics(): Promise<{
    totalBusinessHours: number;
    resourcesWithHours: number;
    avgHoursPerResource: number;
    mostCommonOpenTime: string | null;
    mostCommonCloseTime: string | null;
    resourcesOpen24x7: number;
  }> {
    const [
      totalBusinessHours,
      resourcesWithHours,
      openTimeStats,
      closeTimeStats,
      resources24x7,
    ] = await Promise.all([
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

    // Count unique 24x7 resources
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

  /**
   * Validate business hour time format
   */
  validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Check if business hours are valid (open time before close time)
   */
  validateBusinessHours(openTime: string, closeTime: string): boolean {
    if (!this.validateTimeFormat(openTime) || !this.validateTimeFormat(closeTime)) {
      return false;
    }

    // Handle overnight hours (e.g., 22:00 to 06:00)
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // If close time is earlier than open time, it's overnight hours
    // This is valid (e.g., 22:00 to 06:00)
    return true;
  }

  /**
   * Get next opening time for a resource
   */
  async getNextOpeningTime(resourceId: string): Promise<{
    dayOfWeek: number;
    openTime: string;
    daysUntilOpen: number;
  } | null> {
    const schedule = await this.getWeeklySchedule(resourceId);
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Check if currently open
    const todayHours = schedule[currentDay];
    if (todayHours && !todayHours.isClosed && todayHours.openTime && todayHours.closeTime) {
      if (currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime) {
        return null; // Currently open
      }
    }

    // Find next opening time
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const dayHours = schedule[checkDay];

      if (dayHours && !dayHours.isClosed && dayHours.openTime) {
        // If it's today, check if opening time is in the future
        if (i === 0 && currentTime >= dayHours.openTime) {
          continue; // Already passed today's opening time
        }

        return {
          dayOfWeek: checkDay,
          openTime: dayHours.openTime,
          daysUntilOpen: i,
        };
      }
    }

    return null; // No opening hours found
  }
}