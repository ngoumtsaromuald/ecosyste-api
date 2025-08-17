# Permission System Documentation

## Overview

The permission system provides fine-grained access control for API endpoints based on user roles, plans, and resource ownership. It integrates seamlessly with both JWT and API Key authentication.

## Components

### 1. PermissionService

The core service that handles permission logic:

- **getUserPermissions()**: Returns all permissions for a user based on userType and plan
- **checkPermission()**: Checks if a user has a specific permission
- **hasPermission()**: Boolean check for permission
- **requirePermission()**: Throws exception if permission is missing
- **requireAllPermissions()**: Requires all specified permissions (AND logic)
- **requireAnyPermission()**: Requires any of the specified permissions (OR logic)
- **checkResourceOwnership()**: Verifies user owns a resource

### 2. Permission Guards

#### PermissionGuard
Base guard that handles permission checking after authentication.

#### AuthPermissionGuard
Combined guard supporting both JWT and API Key authentication with permissions.

#### JwtPermissionGuard
JWT authentication + permission checking.

#### ApiKeyPermissionGuard
API Key authentication + permission checking.

### 3. Decorators

#### @RequirePermissions(permissions, logic?)
```typescript
@RequirePermissions('read:profile')
@RequirePermissions(['read:profile', 'update:profile'], PermissionLogic.AND)
```

#### @RequireAllPermissions(...permissions)
```typescript
@RequireAllPermissions('read:profile', 'update:profile')
```

#### @RequireAnyPermission(...permissions)
```typescript
@RequireAnyPermission('admin:*', 'admin:users:read')
```

#### @RequireAdmin()
```typescript
@RequireAdmin() // Requires 'admin:*' permission
```

#### @RequireBusiness()
```typescript
@RequireBusiness() // Requires business dashboard access
```

#### @RequirePlan(plan)
```typescript
@RequirePlan('PREMIUM') // Requires premium plan permissions
```

#### @RequireOwnership(field?)
```typescript
@RequireOwnership('userId') // Checks resource ownership
```

#### @AllowApiKey()
```typescript
@AllowApiKey() // Allows API key authentication for this endpoint
```

## Permission Structure

### Base Permissions (All Users)
- `read:profile`
- `update:profile`
- `read:own:api-keys`
- `create:own:api-keys`
- `delete:own:api-keys`

### UserType-Based Permissions

#### Individual Users
- `read:own:resources`
- `create:own:resources`
- `update:own:resources`
- `delete:own:resources`

#### Business Users
- All individual permissions plus:
- `read:business:dashboard`
- `read:business:analytics`
- `manage:business:team`

#### Admin Users
- `admin:*` (wildcard permission for all admin actions)

### Plan-Based Permissions

#### FREE Plan
- Base permissions only

#### PRO Plan
- `read:advanced:analytics`
- `export:data`
- `priority:support`

#### PREMIUM Plan
- All PRO permissions plus:
- `white:label`
- `custom:integrations`

#### ENTERPRISE Plan
- All PREMIUM permissions plus:
- `bulk:operations`
- `dedicated:support`

## Hierarchical Permissions

The system supports hierarchical permissions using wildcards:

- `admin:*` grants all admin permissions
- `admin:users:*` grants all user management permissions
- `admin:users:read` grants only user reading permission

## Usage Examples

### Basic Permission Check
```typescript
@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(JwtPermissionGuard)
  @RequirePermissions('read:profile')
  async getProfile() {
    // Only users with 'read:profile' permission can access
  }
}
```

### Multiple Permissions (AND Logic)
```typescript
@Put('profile')
@UseGuards(JwtPermissionGuard)
@RequireAllPermissions('read:profile', 'update:profile')
async updateProfile() {
  // Requires BOTH permissions
}
```

### Multiple Permissions (OR Logic)
```typescript
@Get('admin/dashboard')
@UseGuards(JwtPermissionGuard)
@RequireAnyPermission('admin:*', 'admin:dashboard:read')
async getAdminDashboard() {
  // Requires ANY of the permissions
}
```

### Resource Ownership
```typescript
@Get('resources/:id')
@UseGuards(JwtPermissionGuard)
@RequirePermissions('read:own:resources')
@RequireOwnership('userId')
async getResource(@Param('id') id: string) {
  // Checks both permission and resource ownership
}
```

### API Key Authentication
```typescript
@Get('public/data')
@UseGuards(AuthPermissionGuard)
@AllowApiKey()
@RequirePermissions('read:public:data')
async getPublicData() {
  // Allows both JWT and API key authentication
}
```

### Plan-Based Access
```typescript
@Get('premium/features')
@UseGuards(JwtPermissionGuard)
@RequirePlan('PREMIUM')
async getPremiumFeatures() {
  // Only premium plan users can access
}
```

## Error Handling

The permission system throws specific exceptions:

- `UnauthorizedException`: User not authenticated
- `ForbiddenException`: Insufficient permissions
- Custom messages for specific permission failures

## Integration with Existing Guards

The permission guards integrate with existing authentication guards:

```typescript
// JWT + Permissions
@UseGuards(JwtPermissionGuard)

// API Key + Permissions  
@UseGuards(ApiKeyPermissionGuard)

// Both JWT and API Key + Permissions
@UseGuards(AuthPermissionGuard)
@AllowApiKey()
```

## Testing

The permission system includes comprehensive unit tests:

- PermissionService tests: `permission.service.spec.ts`
- PermissionGuard tests: `permission.guard.spec.ts`

Run tests with:
```bash
npm test -- src/auth/services/permission.service.spec.ts
npm test -- src/auth/guards/permission.guard.spec.ts
```

## Best Practices

1. **Use specific permissions**: Prefer `read:users` over broad permissions
2. **Combine with ownership checks**: Use `@RequireOwnership()` for resource-specific endpoints
3. **Plan-based features**: Use `@RequirePlan()` for premium features
4. **API key endpoints**: Use `@AllowApiKey()` for integration endpoints
5. **Admin endpoints**: Use `@RequireAdmin()` for administrative functions

## Security Considerations

1. **Principle of least privilege**: Grant minimum required permissions
2. **Audit logging**: All permission checks are logged via AuditService
3. **Hierarchical permissions**: Use wildcards carefully to avoid over-privileging
4. **Resource ownership**: Always verify ownership for user-specific resources
5. **Plan enforcement**: Ensure plan-based features are properly protected