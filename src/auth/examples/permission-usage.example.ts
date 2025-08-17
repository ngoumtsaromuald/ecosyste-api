import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import {
  RequirePermissions,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireAdmin,
  RequireBusiness,
  RequirePlan,
  RequireOwnership,
  AllowApiKey
} from '../decorators/require-permissions.decorator';
import {
  AuthPermissionGuard,
  JwtPermissionGuard,
  ApiKeyPermissionGuard
} from '../guards/auth-permission.guard';

/**
 * Example controller demonstrating permission system usage
 */
@Controller('examples/permissions')
@ApiTags('Permission Examples')
export class PermissionExampleController {

  /**
   * Basic permission requirement - only authenticated users with 'read:profile' permission
   */
  @Get('profile')
  @UseGuards(JwtPermissionGuard)
  @RequirePermissions('read:profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile - requires read:profile permission' })
  async getProfile() {
    return { message: 'Profile data accessible with read:profile permission' };
  }

  /**
   * Multiple permissions required (AND logic)
   */
  @Put('profile')
  @UseGuards(JwtPermissionGuard)
  @RequireAllPermissions('read:profile', 'update:profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile - requires both read and update permissions' })
  async updateProfile(@Body() updateData: any) {
    return { message: 'Profile updated - required both read:profile AND update:profile' };
  }

  /**
   * Any of multiple permissions required (OR logic)
   */
  @Get('dashboard')
  @UseGuards(JwtPermissionGuard)
  @RequireAnyPermission('read:business:dashboard', 'admin:*')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Access dashboard - requires business dashboard OR admin permission' })
  async getDashboard() {
    return { message: 'Dashboard accessible with business dashboard OR admin permission' };
  }

  /**
   * Admin-only endpoint
   */
  @Get('admin/users')
  @UseGuards(JwtPermissionGuard)
  @RequireAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users - admin only' })
  async listAllUsers() {
    return { message: 'Admin-only endpoint - requires admin:* permission' };
  }

  /**
   * Business user endpoint
   */
  @Get('business/analytics')
  @UseGuards(JwtPermissionGuard)
  @RequireBusiness()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Business analytics - business users only' })
  async getBusinessAnalytics() {
    return { message: 'Business analytics - requires business dashboard permission' };
  }

  /**
   * Plan-based access
   */
  @Get('premium/features')
  @UseGuards(JwtPermissionGuard)
  @RequirePlan('PREMIUM')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Premium features - requires premium plan' })
  async getPremiumFeatures() {
    return { message: 'Premium features - requires premium plan permissions' };
  }

  /**
   * Resource ownership check
   */
  @Get('resources/:id')
  @UseGuards(JwtPermissionGuard)
  @RequirePermissions('read:own:resources')
  @RequireOwnership('userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resource - requires ownership check' })
  async getResource(@Param('id') id: string) {
    return { message: `Resource ${id} - ownership verified` };
  }

  /**
   * API Key authentication allowed
   */
  @Get('public/data')
  @UseGuards(AuthPermissionGuard)
  @AllowApiKey()
  @RequirePermissions('read:public:data')
  @ApiBearerAuth()
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Public data - allows both JWT and API key auth' })
  async getPublicData() {
    return { message: 'Public data accessible with JWT or API key' };
  }

  /**
   * API Key only endpoint
   */
  @Post('api/webhook')
  @UseGuards(ApiKeyPermissionGuard)
  @RequirePermissions('webhook:receive')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Webhook endpoint - API key only' })
  async receiveWebhook(@Body() webhookData: any) {
    return { message: 'Webhook received - API key authentication only' };
  }

  /**
   * Complex permission example with multiple requirements
   */
  @Delete('admin/resources/:id')
  @UseGuards(JwtPermissionGuard)
  @RequireAnyPermission('admin:*', 'admin:resources:delete')
  @RequireOwnership('userId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete resource - requires admin permission AND ownership check'
  })
  async deleteResource(@Param('id') id: string) {
    return { message: `Resource ${id} deleted - admin permission and ownership verified` };
  }

  /**
   * Enterprise-only bulk operations
   */
  @Post('bulk/import')
  @UseGuards(JwtPermissionGuard)
  @RequireAllPermissions('bulk:operations', 'import:data')
  @RequirePlan('ENTERPRISE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk import - enterprise plan with bulk operations permission' })
  async bulkImport(@Body() importData: any) {
    return {
      message: 'Bulk import completed - enterprise plan with bulk operations permission'
    };
  }

  /**
   * No authentication required (public endpoint)
   */
  @Get('public/info')
  @ApiOperation({ summary: 'Public information - no authentication required' })
  async getPublicInfo() {
    return { message: 'Public information - no authentication required' };
  }
}