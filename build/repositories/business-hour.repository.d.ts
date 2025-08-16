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
    dayOfWeek: number;
    openTime?: string | null;
    closeTime?: string | null;
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
export declare class BusinessHourRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMany(params: BusinessHourFindManyParams): Promise<BusinessHour[]>;
    findById(id: string, include?: Prisma.BusinessHourInclude): Promise<BusinessHour | null>;
    create(data: CreateBusinessHourData): Promise<BusinessHour>;
    update(id: string, data: UpdateBusinessHourData): Promise<BusinessHour>;
    delete(id: string): Promise<BusinessHour>;
    findByResourceId(resourceId: string): Promise<BusinessHour[]>;
    getWeeklySchedule(resourceId: string): Promise<WeeklySchedule>;
    findByDayOfWeek(dayOfWeek: number, resourceId?: string): Promise<BusinessHourWithResource[]>;
    findResourcesOpenAt(dayOfWeek: number, time: string): Promise<BusinessHourWithResource[]>;
    findResourcesCurrentlyOpen(): Promise<BusinessHourWithResource[]>;
    setWeeklySchedule(resourceId: string, schedule: CreateBusinessHourData[]): Promise<BusinessHour[]>;
    upsertBusinessHour(resourceId: string, dayOfWeek: number, data: Omit<CreateBusinessHourData, 'resourceId' | 'dayOfWeek'>): Promise<BusinessHour>;
    deleteByResourceId(resourceId: string): Promise<Prisma.BatchPayload>;
    find24x7Resources(): Promise<BusinessHourWithResource[]>;
    findResourcesClosedOn(dayOfWeek: number): Promise<BusinessHourWithResource[]>;
    getStatistics(): Promise<{
        totalBusinessHours: number;
        resourcesWithHours: number;
        avgHoursPerResource: number;
        mostCommonOpenTime: string | null;
        mostCommonCloseTime: string | null;
        resourcesOpen24x7: number;
    }>;
    validateTimeFormat(time: string): boolean;
    validateBusinessHours(openTime: string, closeTime: string): boolean;
    getNextOpeningTime(resourceId: string): Promise<{
        dayOfWeek: number;
        openTime: string;
        daysUntilOpen: number;
    } | null>;
}
