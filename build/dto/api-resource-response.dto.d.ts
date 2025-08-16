import { ResourceType, ResourceStatus, ResourcePlan } from '../domain/enums';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';
import { SeoDataDto } from './seo-data.dto';
import { BusinessHourDto } from './business-hour.dto';
import { ResourceImageDto } from './resource-image.dto';
import { CategoryResponseDto } from './category-response.dto';
export declare class ApiResourceResponseDto {
    id: string;
    userId: string;
    name: string;
    slug: string;
    description?: string;
    resourceType: ResourceType;
    categoryId: string;
    category: CategoryResponseDto;
    address?: AddressDto;
    contact?: ContactDto;
    status: ResourceStatus;
    plan: ResourcePlan;
    verified: boolean;
    seo?: SeoDataDto;
    businessHours: BusinessHourDto[];
    images: ResourceImageDto[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}
