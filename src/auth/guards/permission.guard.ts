import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PermissionService, User } from '../services/permission.service';
import { 
  PERMISSIONS_KEY, 
  PERMISSION_LOGIC_KEY, 
  PermissionLogic 
} from '../decorators/require-permissions.decorator';

export interface AuthenticatedRequest extends Request {
  user: User;
  token?: string;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    // Check if user is authenticated
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get permission logic (AND/OR)
    const permissionLogic = this.reflector.getAllAndOverride<PermissionLogic>(
      PERMISSION_LOGIC_KEY,
      [context.getHandler(), context.getClass()],
    ) || PermissionLogic.AND;

    // Get ownership field for resource ownership check
    const ownershipField = this.reflector.getAllAndOverride<string>(
      'ownership_field',
      [context.getHandler(), context.getClass()],
    );

    const user = request.user;
    const permissionContext = {
      userId: user.id,
      action: request.method,
      resource: request.route?.path || request.url,
    };

    try {
      // Check resource ownership if required
      if (ownershipField) {
        await this.checkResourceOwnership(request, user, ownershipField);
      }

      // Check permissions based on logic
      if (permissionLogic === PermissionLogic.OR) {
        await this.permissionService.requireAnyPermission(
          user,
          requiredPermissions,
          permissionContext
        );
      } else {
        await this.permissionService.requireAllPermissions(
          user,
          requiredPermissions,
          permissionContext
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async checkResourceOwnership(
    request: AuthenticatedRequest,
    user: User,
    ownershipField: string
  ): Promise<void> {
    // Get resource ID from request parameters
    const resourceId = request.params?.id || request.params?.resourceId;
    
    if (!resourceId) {
      // If no resource ID in params, check request body
      const resourceUserId = request.body?.[ownershipField];
      if (resourceUserId) {
        const ownershipResult = await this.permissionService.checkResourceOwnership(
          user,
          resourceUserId
        );
        
        if (!ownershipResult.allowed) {
          throw new ForbiddenException(ownershipResult.reason);
        }
      }
      return;
    }

    // For resource-based ownership, we would need to fetch the resource
    // and check its ownership. This is a simplified version.
    // In a real implementation, you might inject a generic repository
    // or service to fetch the resource and check ownership.
    
    // For now, we'll assume the resource ID in the URL belongs to the user
    // This should be enhanced based on your specific use case
    const ownershipResult = await this.permissionService.checkResourceOwnership(
      user,
      resourceId
    );
    
    if (!ownershipResult.allowed) {
      throw new ForbiddenException(ownershipResult.reason);
    }
  }
}