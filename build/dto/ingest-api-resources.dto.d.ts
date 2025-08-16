import { CreateApiResourceDto } from './create-api-resource.dto';
export declare class IngestApiResourcesDto {
    resources: CreateApiResourceDto[];
    skipErrors?: boolean;
    skipDuplicates?: boolean;
    batchSize?: number;
}
export declare class IngestItemResultDto {
    index: number;
    name: string;
    status: 'success' | 'failed' | 'skipped';
    resourceId?: string;
    slug?: string;
    error?: string;
    errorType?: string;
    skipReason?: string;
    processingTimeMs: number;
}
export declare class IngestResultDto {
    total: number;
    processed: number;
    failed: number;
    skipped: number;
    processingTimeMs: number;
    results: IngestItemResultDto[];
    errorSummary: Record<string, number>;
}
