import { BadRequestException } from '@nestjs/common';
export declare class BusinessLogicException extends BadRequestException {
    constructor(message: string, code?: string);
    static insufficientPermissions(action: string): BusinessLogicException;
    static resourceNotPublished(resourceId: string): BusinessLogicException;
    static invalidResourceStatus(currentStatus: string, targetStatus: string): BusinessLogicException;
    static quotaExceeded(quotaType: string, limit: number): BusinessLogicException;
}
