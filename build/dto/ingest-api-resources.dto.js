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
exports.IngestResultDto = exports.IngestItemResultDto = exports.IngestApiResourcesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_api_resource_dto_1 = require("./create-api-resource.dto");
class IngestApiResourcesDto {
    constructor() {
        this.skipErrors = false;
        this.skipDuplicates = true;
        this.batchSize = 50;
    }
}
exports.IngestApiResourcesDto = IngestApiResourcesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of API resources to ingest',
        type: [create_api_resource_dto_1.CreateApiResourceDto],
        example: [
            {
                name: 'Restaurant Le Palais',
                description: 'Authentic Cameroonian cuisine',
                resourceType: 'BUSINESS',
                categoryId: '123e4567-e89b-12d3-a456-426614174000',
                address: {
                    addressLine1: '123 Main Street',
                    city: 'Yaoundé',
                    country: 'CM'
                }
            }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_api_resource_dto_1.CreateApiResourceDto),
    __metadata("design:type", Array)
], IngestApiResourcesDto.prototype, "resources", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether to skip validation errors and continue with valid resources',
        example: true,
        default: false,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], IngestApiResourcesDto.prototype, "skipErrors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether to skip duplicate resources (based on name similarity)',
        example: true,
        default: true,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], IngestApiResourcesDto.prototype, "skipDuplicates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Batch size for processing (max 100)',
        example: 50,
        default: 50,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], IngestApiResourcesDto.prototype, "batchSize", void 0);
class IngestItemResultDto {
}
exports.IngestItemResultDto = IngestItemResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Index of the resource in the original array',
        example: 0
    }),
    __metadata("design:type", Number)
], IngestItemResultDto.prototype, "index", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Original resource name from the request',
        example: 'Restaurant Le Palais'
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing status',
        enum: ['success', 'failed', 'skipped'],
        example: 'success'
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the created resource (if successful)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Generated slug (if successful)',
        example: 'restaurant-le-palais',
        required: false
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message (if failed)',
        example: 'Validation failed: Category ID is required',
        required: false
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error type for categorization',
        example: 'validation_error',
        required: false
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "errorType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reason for skipping (if skipped)',
        example: 'Duplicate resource found with similar name',
        required: false
    }),
    __metadata("design:type", String)
], IngestItemResultDto.prototype, "skipReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing time for this item in milliseconds',
        example: 25
    }),
    __metadata("design:type", Number)
], IngestItemResultDto.prototype, "processingTimeMs", void 0);
class IngestResultDto {
}
exports.IngestResultDto = IngestResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of resources in the request',
        example: 100
    }),
    __metadata("design:type", Number)
], IngestResultDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of resources successfully processed',
        example: 85
    }),
    __metadata("design:type", Number)
], IngestResultDto.prototype, "processed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of resources that failed validation or processing',
        example: 10
    }),
    __metadata("design:type", Number)
], IngestResultDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of resources skipped due to duplicates',
        example: 5
    }),
    __metadata("design:type", Number)
], IngestResultDto.prototype, "skipped", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Processing time in milliseconds',
        example: 2500
    }),
    __metadata("design:type", Number)
], IngestResultDto.prototype, "processingTimeMs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detailed results for each resource',
        type: [IngestItemResultDto]
    }),
    __metadata("design:type", Array)
], IngestResultDto.prototype, "results", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Summary of errors by type',
        example: {
            'validation_error': 5,
            'duplicate_error': 3,
            'enrichment_error': 2
        }
    }),
    __metadata("design:type", Object)
], IngestResultDto.prototype, "errorSummary", void 0);
//# sourceMappingURL=ingest-api-resources.dto.js.map