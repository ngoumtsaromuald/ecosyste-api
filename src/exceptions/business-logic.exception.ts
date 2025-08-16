import { BadRequestException } from '@nestjs/common';

/**
 * Exception thrown when business logic rules are violated
 */
export class BusinessLogicException extends BadRequestException {
  constructor(message: string, code?: string) {
    super({
      message,
      code: code || 'BUSINESS_LOGIC_ERROR',
    });
  }

  static insufficientPermissions(action: string): BusinessLogicException {
    return new BusinessLogicException(
      `Insufficient permissions to perform action: ${action}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  static resourceNotPublished(resourceId: string): BusinessLogicException {
    return new BusinessLogicException(
      `Resource ${resourceId} is not published and cannot be accessed`,
      'RESOURCE_NOT_PUBLISHED'
    );
  }

  static invalidResourceStatus(currentStatus: string, targetStatus: string): BusinessLogicException {
    return new BusinessLogicException(
      `Cannot change resource status from ${currentStatus} to ${targetStatus}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  static quotaExceeded(quotaType: string, limit: number): BusinessLogicException {
    return new BusinessLogicException(
      `${quotaType} quota exceeded. Limit: ${limit}`,
      'QUOTA_EXCEEDED'
    );
  }
}