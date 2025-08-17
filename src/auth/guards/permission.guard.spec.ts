import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard, AuthenticatedRequest } from './permission.guard';
import { PermissionService, User } from '../services/permission.service';
import { UserType, Plan } from '@prisma/client';
import { PermissionLogic } from '../decorators/require-permissions.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let permissionService: jest.Mocked<PermissionService>;
  let reflector: jest.Mocked<Reflector>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
  };

  const mockAdminUser: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    userType: UserType.ADMIN,
    plan: Plan.ENTERPRISE,
  };

  beforeEach(async () => {
    const mockPermissionService = {
      requireAllPermissions: jest.fn(),
      requireAnyPermission: jest.fn(),
      checkResourceOwnership: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    permissionService = module.get(PermissionService);
    reflector = module.get(Reflector);
  });

  const createMockExecutionContext = (
    user?: User,
    permissions?: string[],
    logic?: PermissionLogic,
    ownershipField?: string,
    params?: any,
    body?: any
  ): ExecutionContext => {
    const mockRequest: Partial<AuthenticatedRequest> = {
      user,
      method: 'GET',
      url: '/api/test',
      route: { path: '/api/test' },
      params: params || {},
      body: body || {},
    };

    reflector.getAllAndOverride
      .mockReturnValueOnce(permissions) // PERMISSIONS_KEY
      .mockReturnValueOnce(logic) // PERMISSION_LOGIC_KEY
      .mockReturnValueOnce(ownershipField); // ownership_field

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access when no permissions are required', async () => {
      const context = createMockExecutionContext(mockUser, []);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when no permissions metadata exists', async () => {
      const context = createMockExecutionContext(mockUser, undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should check all permissions with AND logic', async () => {
      const permissions = ['read:profile', 'update:profile'];
      const context = createMockExecutionContext(mockUser, permissions, PermissionLogic.AND);

      permissionService.requireAllPermissions.mockResolvedValue();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.requireAllPermissions).toHaveBeenCalledWith(
        mockUser,
        permissions,
        expect.objectContaining({
          userId: mockUser.id,
          action: 'GET',
          resource: '/api/test',
        })
      );
    });

    it('should check any permission with OR logic', async () => {
      const permissions = ['read:profile', 'admin:users'];
      const context = createMockExecutionContext(mockUser, permissions, PermissionLogic.OR);

      permissionService.requireAnyPermission.mockResolvedValue();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.requireAnyPermission).toHaveBeenCalledWith(
        mockUser,
        permissions,
        expect.objectContaining({
          userId: mockUser.id,
          action: 'GET',
          resource: '/api/test',
        })
      );
    });

    it('should default to AND logic when no logic is specified', async () => {
      const permissions = ['read:profile'];
      const context = createMockExecutionContext(mockUser, permissions);

      permissionService.requireAllPermissions.mockResolvedValue();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.requireAllPermissions).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when permissions are insufficient', async () => {
      const permissions = ['admin:users'];
      const context = createMockExecutionContext(mockUser, permissions);

      permissionService.requireAllPermissions.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should check resource ownership when ownership field is specified', async () => {
      const permissions = ['read:resource'];
      const ownershipField = 'userId';
      const body = { userId: 'other-user' };
      const context = createMockExecutionContext(
        mockUser,
        permissions,
        PermissionLogic.AND,
        ownershipField,
        {},
        body
      );

      permissionService.checkResourceOwnership.mockResolvedValue({ allowed: true });
      permissionService.requireAllPermissions.mockResolvedValue();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.checkResourceOwnership).toHaveBeenCalledWith(
        mockUser,
        'other-user'
      );
    });

    it('should check resource ownership with resource ID from params', async () => {
      const permissions = ['read:resource'];
      const ownershipField = 'userId';
      const params = { id: 'resource-123' };
      const context = createMockExecutionContext(
        mockUser,
        permissions,
        PermissionLogic.AND,
        ownershipField,
        params
      );

      permissionService.checkResourceOwnership.mockResolvedValue({ allowed: true });
      permissionService.requireAllPermissions.mockResolvedValue();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionService.checkResourceOwnership).toHaveBeenCalledWith(
        mockUser,
        'resource-123'
      );
    });

    it('should throw ForbiddenException when resource ownership check fails', async () => {
      const permissions = ['read:resource'];
      const ownershipField = 'userId';
      const body = { userId: 'other-user' };
      const context = createMockExecutionContext(
        mockUser,
        permissions,
        PermissionLogic.AND,
        ownershipField,
        {},
        body
      );

      permissionService.checkResourceOwnership.mockResolvedValue({
        allowed: false,
        reason: 'You can only access your own resources',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('You can only access your own resources')
      );
    });

    it('should handle generic errors and throw ForbiddenException', async () => {
      const permissions = ['read:profile'];
      const context = createMockExecutionContext(mockUser, permissions);

      permissionService.requireAllPermissions.mockRejectedValue(
        new Error('Generic error')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Insufficient permissions')
      );
    });
  });
});