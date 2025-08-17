import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PermissionService, User } from './permission.service';
import { AuditService } from './audit.service';
import { UserType, Plan } from '@prisma/client';

describe('PermissionService', () => {
  let service: PermissionService;
  let auditService: jest.Mocked<AuditService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    userType: UserType.INDIVIDUAL,
    plan: Plan.FREE,
  };

  const mockBusinessUser: User = {
    id: 'user-2',
    email: 'business@example.com',
    userType: UserType.BUSINESS,
    plan: Plan.PRO,
  };

  const mockAdminUser: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    userType: UserType.ADMIN,
    plan: Plan.ENTERPRISE,
  };

  beforeEach(async () => {
    const mockAuditService = {
      logPermissionCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPermissions', () => {
    it('should return base permissions for individual user', async () => {
      const permissions = await service.getUserPermissions(mockUser);
      
      expect(permissions).toContain('read:profile');
      expect(permissions).toContain('update:profile');
      expect(permissions).toContain('read:own:api-keys');
      expect(permissions).toContain('read:own:resources');
    });

    it('should return business permissions for business user', async () => {
      const permissions = await service.getUserPermissions(mockBusinessUser);
      
      expect(permissions).toContain('read:business:dashboard');
      expect(permissions).toContain('read:business:analytics');
      expect(permissions).toContain('manage:business:team');
      expect(permissions).toContain('read:advanced:analytics'); // PRO plan
    });

    it('should return admin wildcard permission for admin user', async () => {
      const permissions = await service.getUserPermissions(mockAdminUser);
      
      expect(permissions).toContain('admin:*');
    });

    it('should include plan-based permissions', async () => {
      const proUser = { ...mockUser, plan: Plan.PRO };
      const permissions = await service.getUserPermissions(proUser);
      
      expect(permissions).toContain('read:advanced:analytics');
      expect(permissions).toContain('export:data');
      expect(permissions).toContain('priority:support');
    });
  });

  describe('checkPermission', () => {
    it('should allow admin user with wildcard permission', async () => {
      const result = await service.checkPermission(mockAdminUser, 'any:permission');
      
      expect(result.allowed).toBe(true);
      expect(auditService.logPermissionCheck).toHaveBeenCalledWith(
        mockAdminUser.id,
        'any:permission',
        true,
        undefined
      );
    });

    it('should allow user with exact permission match', async () => {
      const result = await service.checkPermission(mockUser, 'read:profile');
      
      expect(result.allowed).toBe(true);
      expect(auditService.logPermissionCheck).toHaveBeenCalledWith(
        mockUser.id,
        'read:profile',
        true,
        undefined
      );
    });

    it('should deny user without permission', async () => {
      const result = await service.checkPermission(mockUser, 'admin:users');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Insufficient permissions');
      expect(auditService.logPermissionCheck).toHaveBeenCalledWith(
        mockUser.id,
        'admin:users',
        false,
        undefined
      );
    });

    it('should handle hierarchical permissions', async () => {
      // Mock admin user with specific hierarchical permission
      const adminWithHierarchy = { ...mockAdminUser };
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue(['admin:users:*']);
      
      const result = await service.checkPermission(adminWithHierarchy, 'admin:users:read');
      
      expect(result.allowed).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true for allowed permission', async () => {
      const result = await service.hasPermission(mockUser, 'read:profile');
      expect(result).toBe(true);
    });

    it('should return false for denied permission', async () => {
      const result = await service.hasPermission(mockUser, 'admin:users');
      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw for allowed permission', async () => {
      await expect(
        service.requirePermission(mockUser, 'read:profile')
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for denied permission', async () => {
      await expect(
        service.requirePermission(mockUser, 'admin:users')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('requireAllPermissions', () => {
    it('should not throw when all permissions are allowed', async () => {
      await expect(
        service.requireAllPermissions(mockUser, ['read:profile', 'update:profile'])
      ).resolves.not.toThrow();
    });

    it('should throw when any permission is denied', async () => {
      await expect(
        service.requireAllPermissions(mockUser, ['read:profile', 'admin:users'])
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('requireAnyPermission', () => {
    it('should not throw when at least one permission is allowed', async () => {
      await expect(
        service.requireAnyPermission(mockUser, ['read:profile', 'admin:users'])
      ).resolves.not.toThrow();
    });

    it('should throw when no permissions are allowed', async () => {
      await expect(
        service.requireAnyPermission(mockUser, ['admin:users', 'admin:system'])
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkResourceOwnership', () => {
    it('should allow admin to access any resource', async () => {
      const result = await service.checkResourceOwnership(mockAdminUser, 'other-user-id');
      expect(result.allowed).toBe(true);
    });

    it('should allow user to access their own resource', async () => {
      const result = await service.checkResourceOwnership(mockUser, mockUser.id);
      expect(result.allowed).toBe(true);
    });

    it('should deny user access to other user\'s resource', async () => {
      const result = await service.checkResourceOwnership(mockUser, 'other-user-id');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('You can only access your own resources');
    });
  });

  describe('getPermissionHierarchy', () => {
    it('should return correct hierarchy for nested permission', () => {
      const hierarchy = service.getPermissionHierarchy('admin:users:read');
      expect(hierarchy).toEqual(['admin', 'admin:users', 'admin:users:read']);
    });

    it('should return single item for simple permission', () => {
      const hierarchy = service.getPermissionHierarchy('read');
      expect(hierarchy).toEqual(['read']);
    });
  });

  describe('isHierarchicalMatch', () => {
    it('should match hierarchical wildcard permission', () => {
      const result = service.isHierarchicalMatch('admin:users:*', 'admin:users:read');
      expect(result).toBe(true);
    });

    it('should not match non-hierarchical permission', () => {
      const result = service.isHierarchicalMatch('admin:users', 'admin:users:read');
      expect(result).toBe(false);
    });

    it('should not match different hierarchy', () => {
      const result = service.isHierarchicalMatch('admin:system:*', 'admin:users:read');
      expect(result).toBe(false);
    });
  });
});