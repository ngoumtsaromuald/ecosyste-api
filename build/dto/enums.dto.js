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
exports.PricingTierDto = exports.PlanDto = exports.UserTypeDto = exports.ResourcePlanDto = exports.ResourceStatusDto = exports.ResourceTypeDto = exports.PricingTier = exports.Plan = exports.UserType = exports.ResourcePlan = exports.ResourceStatus = exports.ResourceType = void 0;
const swagger_1 = require("@nestjs/swagger");
var ResourceType;
(function (ResourceType) {
    ResourceType["BUSINESS"] = "BUSINESS";
    ResourceType["SERVICE"] = "SERVICE";
    ResourceType["DATA"] = "DATA";
    ResourceType["API"] = "API";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["ACTIVE"] = "ACTIVE";
    ResourceStatus["PENDING"] = "PENDING";
    ResourceStatus["SUSPENDED"] = "SUSPENDED";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
var ResourcePlan;
(function (ResourcePlan) {
    ResourcePlan["FREE"] = "FREE";
    ResourcePlan["PREMIUM"] = "PREMIUM";
    ResourcePlan["FEATURED"] = "FEATURED";
})(ResourcePlan || (exports.ResourcePlan = ResourcePlan = {}));
var UserType;
(function (UserType) {
    UserType["INDIVIDUAL"] = "INDIVIDUAL";
    UserType["BUSINESS"] = "BUSINESS";
    UserType["ADMIN"] = "ADMIN";
})(UserType || (exports.UserType = UserType = {}));
var Plan;
(function (Plan) {
    Plan["FREE"] = "FREE";
    Plan["PRO"] = "PRO";
    Plan["PREMIUM"] = "PREMIUM";
    Plan["ENTERPRISE"] = "ENTERPRISE";
})(Plan || (exports.Plan = Plan = {}));
var PricingTier;
(function (PricingTier) {
    PricingTier["STANDARD"] = "STANDARD";
    PricingTier["BUSINESS"] = "BUSINESS";
    PricingTier["ENTERPRISE"] = "ENTERPRISE";
})(PricingTier || (exports.PricingTier = PricingTier = {}));
class ResourceTypeDto {
}
exports.ResourceTypeDto = ResourceTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ResourceType,
        description: 'Type of API resource',
        example: ResourceType.BUSINESS
    }),
    __metadata("design:type", String)
], ResourceTypeDto.prototype, "value", void 0);
class ResourceStatusDto {
}
exports.ResourceStatusDto = ResourceStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ResourceStatus,
        description: 'Status of API resource',
        example: ResourceStatus.ACTIVE
    }),
    __metadata("design:type", String)
], ResourceStatusDto.prototype, "value", void 0);
class ResourcePlanDto {
}
exports.ResourcePlanDto = ResourcePlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ResourcePlan,
        description: 'Plan type for API resource',
        example: ResourcePlan.FREE
    }),
    __metadata("design:type", String)
], ResourcePlanDto.prototype, "value", void 0);
class UserTypeDto {
}
exports.UserTypeDto = UserTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: UserType,
        description: 'Type of user account',
        example: UserType.INDIVIDUAL
    }),
    __metadata("design:type", String)
], UserTypeDto.prototype, "value", void 0);
class PlanDto {
}
exports.PlanDto = PlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: Plan,
        description: 'User subscription plan',
        example: Plan.FREE
    }),
    __metadata("design:type", String)
], PlanDto.prototype, "value", void 0);
class PricingTierDto {
}
exports.PricingTierDto = PricingTierDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: PricingTier,
        description: 'Pricing tier for services',
        example: PricingTier.STANDARD
    }),
    __metadata("design:type", String)
], PricingTierDto.prototype, "value", void 0);
//# sourceMappingURL=enums.dto.js.map