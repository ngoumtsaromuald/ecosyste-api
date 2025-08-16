import { ResourceType } from '../domain/enums';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';
import { SeoDataDto } from './seo-data.dto';
import { BusinessHourDto } from './business-hour.dto';
import { CreateResourceImageDto } from './resource-image.dto';
export declare class CreateApiResourceDto {
    name: string;
    description?: string;
    resourceType: ResourceType;
    categoryId: string;
    address?: AddressDto;
    contact?: ContactDto;
    seo?: SeoDataDto;
    businessHours?: BusinessHourDto[];
    images?: CreateResourceImageDto[];
}
