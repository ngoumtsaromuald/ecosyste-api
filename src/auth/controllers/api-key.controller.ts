import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  HttpCode, 
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse
} from '@nestjs/swagger';
import { ApiKeyService } from '../services/api-key.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { 
  CreateApiKeyDto, 
  UpdateApiKeyDto, 
  ApiKeyResponseDto, 
  ApiKeyListResponseDto 
} from '../dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: string;
    plan: string;
  };
}

@Controller('api-keys')
@ApiTags('API Keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOperation({ 
    summary: 'List user API keys',
    description: 'Retrieve all API keys for the authenticated user. The full key value is never returned in list operations.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API keys retrieved successfully',
    type: [ApiKeyListResponseDto]
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token' })
  async listApiKeys(@Req() req: AuthenticatedRequest): Promise<ApiKeyListResponseDto[]> {
    return this.apiKeyService.listUserApiKeys(req.user.id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create new API key',
    description: 'Create a new API key for the authenticated user. The full key value is only returned once during creation.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'API key created successfully',
    type: ApiKeyResponseDto
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or duplicate key name' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token' })
  async createApiKey(
    @Req() req: AuthenticatedRequest, 
    @Body(ValidationPipe) createDto: CreateApiKeyDto
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.createApiKey(req.user.id, createDto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update API key',
    description: 'Update an existing API key\'s properties such as name, permissions, rate limit, or expiration date.'
  })
  @ApiParam({ name: 'id', description: 'API key ID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'API key updated successfully',
    type: ApiKeyListResponseDto
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or duplicate key name' })
  @ApiNotFoundResponse({ description: 'API key not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token' })
  async updateApiKey(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) keyId: string,
    @Body(ValidationPipe) updateDto: UpdateApiKeyDto
  ): Promise<ApiKeyListResponseDto> {
    return this.apiKeyService.updateApiKey(req.user.id, keyId, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Revoke API key',
    description: 'Permanently revoke (deactivate) an API key. This action cannot be undone.'
  })
  @ApiParam({ name: 'id', description: 'API key ID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 204, 
    description: 'API key revoked successfully'
  })
  @ApiNotFoundResponse({ description: 'API key not found' })
  @ApiBadRequestResponse({ description: 'API key is already inactive' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token' })
  async revokeApiKey(
    @Req() req: AuthenticatedRequest, 
    @Param('id', ParseUUIDPipe) keyId: string
  ): Promise<void> {
    await this.apiKeyService.revokeApiKey(req.user.id, keyId);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Reactivate API key',
    description: 'Reactivate a previously deactivated API key. Cannot reactivate expired keys.'
  })
  @ApiParam({ name: 'id', description: 'API key ID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 204, 
    description: 'API key reactivated successfully'
  })
  @ApiNotFoundResponse({ description: 'API key not found' })
  @ApiBadRequestResponse({ description: 'API key is already active or has expired' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token' })
  async reactivateApiKey(
    @Req() req: AuthenticatedRequest, 
    @Param('id', ParseUUIDPipe) keyId: string
  ): Promise<void> {
    await this.apiKeyService.reactivateApiKey(req.user.id, keyId);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get API key statistics',
    description: 'Get statistics about the user\'s API keys including total count, active/inactive counts, and usage information.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API key statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of API keys' },
        active: { type: 'number', description: 'Number of active API keys' },
        inactive: { type: 'number', description: 'Number of inactive API keys' },
        expired: { type: 'number', description: 'Number of expired API keys' },
        recentlyUsed: { type: 'number', description: 'Number of keys used in the last 7 days' },
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing authentication token' })
  async getApiKeyStats(@Req() req: AuthenticatedRequest): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    recentlyUsed: number;
  }> {
    return this.apiKeyService.getUserApiKeyStats(req.user.id);
  }
}