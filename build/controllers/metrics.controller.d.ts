import { MetricsService } from '../services/metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    getMetrics(): Promise<string>;
}
