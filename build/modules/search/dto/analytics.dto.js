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
exports.UpdateSavedSearchDto = exports.CreateSavedSearchDto = exports.NoResultsQueriesParamsDto = exports.PopularTermsParamsDto = exports.SearchMetricsParamsDto = exports.LogClickDto = exports.LogSearchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const search_interfaces_1 = require("../interfaces/search.interfaces");
class LogSearchDto {
}
exports.LogSearchDto = LogSearchDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' }),
    __metadata("design:type", String)
], LogSearchDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LogSearchDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'ID utilisateur invalide' }),
    __metadata("design:type", String)
], LogSearchDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogSearchDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500, { message: 'User agent invalide' }),
    __metadata("design:type", String)
], LogSearchDto.prototype, "userAgent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIP)(undefined, { message: 'Adresse IP invalide' }),
    __metadata("design:type", String)
], LogSearchDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Nombre de résultats invalide' }),
    (0, class_validator_1.Min)(0, { message: 'Le nombre de résultats doit être positif' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], LogSearchDto.prototype, "resultsCount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Durée invalide' }),
    (0, class_validator_1.IsPositive)({ message: 'La durée doit être positive' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], LogSearchDto.prototype, "took", void 0);
class LogClickDto {
}
exports.LogClickDto = LogClickDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'ID de log de recherche invalide' }),
    __metadata("design:type", String)
], LogClickDto.prototype, "searchLogId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'ID de ressource invalide' }),
    __metadata("design:type", String)
], LogClickDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'ID utilisateur invalide' }),
    __metadata("design:type", String)
], LogClickDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Position invalide' }),
    (0, class_validator_1.Min)(1, { message: 'La position doit être supérieure à 0' }),
    (0, class_validator_1.Max)(100, { message: 'Position maximum de 100' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], LogClickDto.prototype, "position", void 0);
class SearchMetricsParamsDto {
}
exports.SearchMetricsParamsDto = SearchMetricsParamsDto;
__decorate([
    (0, class_validator_1.IsEnum)(search_interfaces_1.TimePeriod, { message: 'Période invalide' }),
    __metadata("design:type", String)
], SearchMetricsParamsDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Date de début invalide' }),
    __metadata("design:type", String)
], SearchMetricsParamsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Date de fin invalide' }),
    __metadata("design:type", String)
], SearchMetricsParamsDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'ID utilisateur invalide' }),
    __metadata("design:type", String)
], SearchMetricsParamsDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Limite invalide' }),
    (0, class_validator_1.Min)(1, { message: 'La limite doit être supérieure à 0' }),
    (0, class_validator_1.Max)(1000, { message: 'Limite maximum de 1000' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], SearchMetricsParamsDto.prototype, "limit", void 0);
class PopularTermsParamsDto {
}
exports.PopularTermsParamsDto = PopularTermsParamsDto;
__decorate([
    (0, class_validator_1.IsEnum)(search_interfaces_1.TimePeriod, { message: 'Période invalide' }),
    __metadata("design:type", String)
], PopularTermsParamsDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Limite invalide' }),
    (0, class_validator_1.Min)(1, { message: 'La limite doit être supérieure à 0' }),
    (0, class_validator_1.Max)(100, { message: 'Limite maximum de 100' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], PopularTermsParamsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Nombre minimum d\'occurrences invalide' }),
    (0, class_validator_1.Min)(1, { message: 'Le nombre minimum doit être supérieur à 0' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], PopularTermsParamsDto.prototype, "minCount", void 0);
class NoResultsQueriesParamsDto {
}
exports.NoResultsQueriesParamsDto = NoResultsQueriesParamsDto;
__decorate([
    (0, class_validator_1.IsEnum)(search_interfaces_1.TimePeriod, { message: 'Période invalide' }),
    __metadata("design:type", String)
], NoResultsQueriesParamsDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Limite invalide' }),
    (0, class_validator_1.Min)(1, { message: 'La limite doit être supérieure à 0' }),
    (0, class_validator_1.Max)(100, { message: 'Limite maximum de 100' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], NoResultsQueriesParamsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Nombre minimum d\'occurrences invalide' }),
    (0, class_validator_1.Min)(1, { message: 'Le nombre minimum doit être supérieur à 0' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], NoResultsQueriesParamsDto.prototype, "minCount", void 0);
class CreateSavedSearchDto {
}
exports.CreateSavedSearchDto = CreateSavedSearchDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'ID utilisateur invalide' }),
    __metadata("design:type", String)
], CreateSavedSearchDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100, { message: 'Le nom doit contenir entre 1 et 100 caractères' }),
    __metadata("design:type", String)
], CreateSavedSearchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' }),
    __metadata("design:type", String)
], CreateSavedSearchDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSavedSearchDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], CreateSavedSearchDto.prototype, "isPublic", void 0);
class UpdateSavedSearchDto {
}
exports.UpdateSavedSearchDto = UpdateSavedSearchDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100, { message: 'Le nom doit contenir entre 1 et 100 caractères' }),
    __metadata("design:type", String)
], UpdateSavedSearchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' }),
    __metadata("design:type", String)
], UpdateSavedSearchDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSavedSearchDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], UpdateSavedSearchDto.prototype, "isPublic", void 0);
//# sourceMappingURL=analytics.dto.js.map