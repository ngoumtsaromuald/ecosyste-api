import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SearchValidationService } from '../services/search-validation.service';
export declare class SearchValidationMiddleware implements NestMiddleware {
    private readonly validationService;
    private readonly logger;
    constructor(validationService: SearchValidationService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private extractSearchParams;
    private getValidationOptions;
}
export declare class SuggestionValidationMiddleware implements NestMiddleware {
    private readonly validationService;
    private readonly logger;
    constructor(validationService: SearchValidationService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare class GeoValidationMiddleware implements NestMiddleware {
    private readonly validationService;
    private readonly logger;
    constructor(validationService: SearchValidationService);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
}
