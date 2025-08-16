import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import { AppService } from './app.service';
import { 
  ResourceTypeDto, 
  ResourceStatusDto, 
  ResourcePlanDto, 
  UserTypeDto, 
  PlanDto, 
  PricingTierDto 
} from './dto/enums.dto';

@ApiTags('Application')
@ApiExtraModels(ResourceTypeDto, ResourceStatusDto, ResourcePlanDto, UserTypeDto, PlanDto, PricingTierDto)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Application info endpoint',
    description: 'Returns basic application information and status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'ROMAPI Backend Core is running!' },
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'development' }
          }
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  getInfo(): { message: string; timestamp: string; version: string; environment: string } {
    return this.appService.getInfo();
  }
}