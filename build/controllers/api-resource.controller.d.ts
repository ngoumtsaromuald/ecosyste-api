import { ApiResourceService, FindAllResult } from '../services/api-resource.service';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { UpdateApiResourceDto } from '../dto/update-api-resource.dto';
import { FindApiResourcesDto } from '../dto/find-api-resources.dto';
import { ApiResourceResponseDto } from '../dto/api-resource-response.dto';
import { IngestApiResourcesDto, IngestResultDto } from '../dto/ingest-api-resources.dto';
export declare class ApiResourceController {
    private readonly apiResourceService;
    constructor(apiResourceService: ApiResourceService);
    findAll(query: FindApiResourcesDto): Promise<FindAllResult>;
    search(query: FindApiResourcesDto): Promise<FindAllResult>;
    findById(id: string): Promise<ApiResourceResponseDto>;
    create(createApiResourceDto: CreateApiResourceDto, req: any): Promise<ApiResourceResponseDto>;
    update(id: string, updateApiResourceDto: UpdateApiResourceDto, req: any): Promise<ApiResourceResponseDto>;
    remove(id: string, req: any): Promise<void>;
    ingest(ingestDto: IngestApiResourcesDto, req: any): Promise<IngestResultDto>;
    getStatistics(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byPlan: Record<string, number>;
        byType: Record<string, number>;
        recentCount: number;
    }>;
    findByUserId(userId: string, limit?: number, offset?: number): Promise<FindAllResult>;
    findByCategory(categoryId: string, limit?: number, offset?: number): Promise<FindAllResult>;
    findBySlug(slug: string): Promise<ApiResourceResponseDto>;
}
