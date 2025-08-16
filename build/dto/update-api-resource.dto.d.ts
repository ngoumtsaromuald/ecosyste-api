import { CreateApiResourceDto } from './create-api-resource.dto';
import { ResourceStatus, ResourcePlan } from '../domain/enums';
declare const UpdateApiResourceDto_base: import("@nestjs/common").Type<Partial<CreateApiResourceDto>>;
export declare class UpdateApiResourceDto extends UpdateApiResourceDto_base {
    slug?: string;
    status?: ResourceStatus;
    plan?: ResourcePlan;
    verified?: boolean;
}
export {};
