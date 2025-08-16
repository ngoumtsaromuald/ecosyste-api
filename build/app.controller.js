"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_service_1 = require("./app.service");
const enums_dto_1 = require("./dto/enums.dto");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getInfo() {
        return this.appService.getInfo();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Application info endpoint',
        description: 'Returns basic application information and status'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getInfo", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('Application'),
    (0, swagger_1.ApiExtraModels)(enums_dto_1.ResourceTypeDto, enums_dto_1.ResourceStatusDto, enums_dto_1.ResourcePlanDto, enums_dto_1.UserTypeDto, enums_dto_1.PlanDto, enums_dto_1.PricingTierDto),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map