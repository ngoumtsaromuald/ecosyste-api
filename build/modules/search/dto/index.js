"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitParamsDto = exports.CacheParamsDto = exports.HealthCheckParamsDto = void 0;
__exportStar(require("./search.dto"), exports);
__exportStar(require("./suggestion.dto"), exports);
__exportStar(require("./analytics.dto"), exports);
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class HealthCheckParamsDto {
}
exports.HealthCheckParamsDto = HealthCheckParamsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HealthCheckParamsDto.prototype, "component", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], HealthCheckParamsDto.prototype, "detailed", void 0);
class CacheParamsDto {
}
exports.CacheParamsDto = CacheParamsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CacheParamsDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'TTL invalide' }),
    (0, class_validator_1.Min)(1, { message: 'TTL doit être supérieur à 0' }),
    (0, class_validator_1.Max)(86400, { message: 'TTL maximum de 24 heures' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], CacheParamsDto.prototype, "ttl", void 0);
class RateLimitParamsDto {
}
exports.RateLimitParamsDto = RateLimitParamsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitParamsDto.prototype, "identifier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Fenêtre de temps invalide' }),
    (0, class_validator_1.Min)(1000, { message: 'Fenêtre minimum de 1 seconde' }),
    (0, class_validator_1.Max)(3600000, { message: 'Fenêtre maximum de 1 heure' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], RateLimitParamsDto.prototype, "windowMs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Nombre maximum de requêtes invalide' }),
    (0, class_validator_1.Min)(1, { message: 'Minimum 1 requête autorisée' }),
    (0, class_validator_1.Max)(10000, { message: 'Maximum 10000 requêtes autorisées' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], RateLimitParamsDto.prototype, "maxRequests", void 0);
//# sourceMappingURL=index.js.map