import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IndexingService } from '../services/indexing.service';
import { IndexingJobData } from '../interfaces/indexing.interface';

@Processor('indexing-queue')
export class IndexingProcessor {
  private readonly logger = new Logger(IndexingProcessor.name);

  constructor(private readonly indexingService: IndexingService) {}

  @Process('index-resource')
  async handleIndexResource(job: Job<IndexingJobData>): Promise<void> {
    this.logger.log(`Processing index job ${job.id} for resource ${job.data.resourceId}`);
    
    try {
      await this.indexingService.processIndexJob(job);
      this.logger.log(`Completed index job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed index job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('update-resource')
  async handleUpdateResource(job: Job<IndexingJobData>): Promise<void> {
    this.logger.log(`Processing update job ${job.id} for resource ${job.data.resourceId}`);
    
    try {
      await this.indexingService.processUpdateJob(job);
      this.logger.log(`Completed update job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed update job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('delete-resource')
  async handleDeleteResource(job: Job<IndexingJobData>): Promise<void> {
    this.logger.log(`Processing delete job ${job.id} for resource ${job.data.resourceId}`);
    
    try {
      await this.indexingService.processDeleteJob(job);
      this.logger.log(`Completed delete job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed delete job ${job.id}:`, error);
      throw error;
    }
  }

  @Process('reindex-all')
  async handleReindexAll(job: Job): Promise<void> {
    this.logger.log(`Processing reindex-all job ${job.id}`);
    
    try {
      await this.indexingService.processReindexJob(job);
      this.logger.log(`Completed reindex-all job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed reindex-all job ${job.id}:`, error);
      throw error;
    }
  }
}