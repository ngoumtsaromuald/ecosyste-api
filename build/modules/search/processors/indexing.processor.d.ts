import { Job } from 'bull';
import { IndexingService } from '../services/indexing.service';
import { IndexingJobData } from '../interfaces/indexing.interface';
export declare class IndexingProcessor {
    private readonly indexingService;
    private readonly logger;
    constructor(indexingService: IndexingService);
    handleIndexResource(job: Job<IndexingJobData>): Promise<void>;
    handleUpdateResource(job: Job<IndexingJobData>): Promise<void>;
    handleDeleteResource(job: Job<IndexingJobData>): Promise<void>;
    handleReindexAll(job: Job): Promise<void>;
}
