import { CustomLoggerService } from '../config/logger.service';
import { ApiResourceRepository } from '../repositories/api-resource.repository';
import { PaginationOptions } from '../repositories/types';
import { CacheService } from '../config/cache.service';
import { ValidationService } from './validation.service';
import { EnrichmentService } from './enrichment.service';
import { CreateApiResourceDto } from '../dto/create-api-resource.dto';
import { UpdateApiResourceDto } from '../dto/update-api-resource.dto';
import { FindApiResourcesDto } from '../dto/find-api-resources.dto';
import { ApiResourceResponseDto } from '../dto/api-resource-response.dto';
import { IngestApiResourcesDto, IngestResultDto } from '../dto/ingest-api-resources.dto';
export interface FindAllResult {
    resources: ApiResourceResponseDto[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare class ApiResourceService {
    private readonly repository;
    private readonly cacheService;
    private readonly validationService;
    private readonly enrichmentService;
    private readonly logger;
    constructor(repository: ApiResourceRepository, cacheService: CacheService, validationService: ValidationService, enrichmentService: EnrichmentService, logger: CustomLoggerService);
    findAll(query: FindApiResourcesDto): Promise<FindAllResult>;
    findById(id: string): Promise<ApiResourceResponseDto>;
    findBySlug(slug: string): Promise<ApiResourceResponseDto>;
    create(createDto: CreateApiResourceDto, userId: string): Promise<ApiResourceResponseDto>;
    update(id: string, updateDto: UpdateApiResourceDto, userId: string): Promise<ApiResourceResponseDto>;
    softDelete(id: string, userId: string): Promise<void>;
    search(query: FindApiResourcesDto): Promise<FindAllResult>;
    findByUserId(userId: string, pagination?: PaginationOptions): Promise<FindAllResult>;
    findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<FindAllResult>;
    ingest(ingestDto: IngestApiResourcesDto, userId: string): Promise<IngestResultDto>;
    private processBatch;
    private processIngestItem;
    private checkForDuplicate;
    private calculateStringSimilarity;
    getStatistics(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byPlan: Record<string, number>;
        byType: Record<string, number>;
        recentCount: number;
    }>;
    private buildCacheKey;
    private convertUpdateDtoToRepositoryData;
    private invalidateResourceCaches;
    private extractAuditableFields;
    private getChanges;
}
