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
exports.SavedSearchDto = exports.SearchClickDto = exports.SearchLogDto = exports.SearchByRegionDto = exports.SearchByCityDto = exports.SearchNearUserDto = exports.SearchByAddressDto = exports.PersonalizedSearchDto = exports.SearchNearbyDto = exports.SearchByCategoryDto = exports.PaginationParamsDto = exports.SortOptionsDto = exports.DateRangeDto = exports.PriceRangeDto = exports.GeoFilterDto = exports.SearchFiltersDto = exports.SearchParamsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const search_interfaces_1 = require("../interfaces/search.interfaces");
class SearchParamsDto {
}
exports.SearchParamsDto = SearchParamsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200, { message: 'La requête doit contenir entre 1 et 200 caractères' }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SearchFiltersDto),
    __metadata("design:type", SearchFiltersDto)
], SearchParamsDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SortOptionsDto),
    __metadata("design:type", SortOptionsDto)
], SearchParamsDto.prototype, "sort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PaginationParamsDto),
    __metadata("design:type", PaginationParamsDto)
], SearchParamsDto.prototype, "pagination", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 facettes autorisées' }),
    __metadata("design:type", Array)
], SearchParamsDto.prototype, "facets", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'userId doit être un UUID valide' }),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchParamsDto.prototype, "sessionId", void 0);
class SearchFiltersDto {
}
exports.SearchFiltersDto = SearchFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(4, { each: true, message: 'Chaque catégorie doit être un UUID valide' }),
    (0, class_validator_1.ArrayMaxSize)(20, { message: 'Maximum 20 catégories autorisées' }),
    __metadata("design:type", Array)
], SearchFiltersDto.prototype, "categories", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.ResourceType, { each: true, message: 'Type de ressource invalide' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 types de ressources autorisés' }),
    __metadata("design:type", Array)
], SearchFiltersDto.prototype, "resourceTypes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.ResourcePlan, { each: true, message: 'Plan de ressource invalide' }),
    (0, class_validator_1.ArrayMaxSize)(5, { message: 'Maximum 5 plans autorisés' }),
    __metadata("design:type", Array)
], SearchFiltersDto.prototype, "plans", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoFilterDto),
    __metadata("design:type", GeoFilterDto)
], SearchFiltersDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PriceRangeDto),
    __metadata("design:type", PriceRangeDto)
], SearchFiltersDto.prototype, "priceRange", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchFiltersDto.prototype, "verified", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100, { message: 'Le nom de ville doit contenir entre 1 et 100 caractères' }),
    __metadata("design:type", String)
], SearchFiltersDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100, { message: 'Le nom de région doit contenir entre 1 et 100 caractères' }),
    __metadata("design:type", String)
], SearchFiltersDto.prototype, "region", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 3, { message: 'Le code pays doit contenir 2 ou 3 caractères' }),
    __metadata("design:type", String)
], SearchFiltersDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(50, { message: 'Maximum 50 tags autorisés' }),
    __metadata("design:type", Array)
], SearchFiltersDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DateRangeDto),
    __metadata("design:type", DateRangeDto)
], SearchFiltersDto.prototype, "dateRange", void 0);
class GeoFilterDto {
}
exports.GeoFilterDto = GeoFilterDto;
__decorate([
    (0, class_validator_1.IsLatitude)({ message: 'Latitude invalide' }),
    __metadata("design:type", Number)
], GeoFilterDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsLongitude)({ message: 'Longitude invalide' }),
    __metadata("design:type", Number)
], GeoFilterDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le rayon doit être un nombre' }),
    (0, class_validator_1.IsPositive)({ message: 'Le rayon doit être positif' }),
    (0, class_validator_1.Max)(1000, { message: 'Le rayon maximum est de 1000 km' }),
    __metadata("design:type", Number)
], GeoFilterDto.prototype, "radius", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['km', 'mi'], { message: 'Unité doit être km ou mi' }),
    __metadata("design:type", String)
], GeoFilterDto.prototype, "unit", void 0);
class PriceRangeDto {
}
exports.PriceRangeDto = PriceRangeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le prix minimum doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le prix minimum doit être positif ou nul' }),
    __metadata("design:type", Number)
], PriceRangeDto.prototype, "min", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le prix maximum doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le prix maximum doit être positif ou nul' }),
    __metadata("design:type", Number)
], PriceRangeDto.prototype, "max", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 3, { message: 'La devise doit contenir 3 caractères' }),
    __metadata("design:type", String)
], PriceRangeDto.prototype, "currency", void 0);
class DateRangeDto {
}
exports.DateRangeDto = DateRangeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Date de début invalide' }),
    __metadata("design:type", String)
], DateRangeDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Date de fin invalide' }),
    __metadata("design:type", String)
], DateRangeDto.prototype, "to", void 0);
class SortOptionsDto {
}
exports.SortOptionsDto = SortOptionsDto;
__decorate([
    (0, class_validator_1.IsEnum)(search_interfaces_1.SortField, { message: 'Champ de tri invalide' }),
    __metadata("design:type", String)
], SortOptionsDto.prototype, "field", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(search_interfaces_1.SortOrder, { message: 'Ordre de tri invalide' }),
    __metadata("design:type", String)
], SortOptionsDto.prototype, "order", void 0);
class PaginationParamsDto {
}
exports.PaginationParamsDto = PaginationParamsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le numéro de page doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'Le numéro de page doit être supérieur à 0' }),
    (0, class_validator_1.Max)(1000, { message: 'Le numéro de page maximum est 1000' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], PaginationParamsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'La limite doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'La limite doit être supérieure à 0' }),
    (0, class_validator_1.Max)(100, { message: 'La limite maximum est 100' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], PaginationParamsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'L\'offset doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'L\'offset doit être positif ou nul' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], PaginationParamsDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationParamsDto.prototype, "searchAfter", void 0);
class SearchByCategoryDto extends SearchParamsDto {
}
exports.SearchByCategoryDto = SearchByCategoryDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'categoryId doit être un UUID valide' }),
    __metadata("design:type", String)
], SearchByCategoryDto.prototype, "categoryId", void 0);
class SearchNearbyDto extends SearchParamsDto {
}
exports.SearchNearbyDto = SearchNearbyDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoFilterDto),
    __metadata("design:type", GeoFilterDto)
], SearchNearbyDto.prototype, "location", void 0);
class PersonalizedSearchDto extends SearchParamsDto {
}
exports.PersonalizedSearchDto = PersonalizedSearchDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'userId doit être un UUID valide' }),
    __metadata("design:type", String)
], PersonalizedSearchDto.prototype, "userId", void 0);
class SearchByAddressDto extends SearchParamsDto {
}
exports.SearchByAddressDto = SearchByAddressDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'L\'adresse est requise' }),
    (0, class_validator_1.Length)(3, 200, { message: 'L\'adresse doit contenir entre 3 et 200 caractères' }),
    __metadata("design:type", String)
], SearchByAddressDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le rayon doit être un nombre' }),
    (0, class_validator_1.IsPositive)({ message: 'Le rayon doit être positif' }),
    (0, class_validator_1.Max)(100, { message: 'Le rayon maximum est de 100 km' }),
    __metadata("design:type", Number)
], SearchByAddressDto.prototype, "radius", void 0);
class SearchNearUserDto extends SearchParamsDto {
}
exports.SearchNearUserDto = SearchNearUserDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => GeoFilterDto),
    __metadata("design:type", GeoFilterDto)
], SearchNearUserDto.prototype, "userLocation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Le rayon doit être un nombre' }),
    (0, class_validator_1.IsPositive)({ message: 'Le rayon doit être positif' }),
    (0, class_validator_1.Max)(100, { message: 'Le rayon maximum est de 100 km' }),
    __metadata("design:type", Number)
], SearchNearUserDto.prototype, "radius", void 0);
class SearchByCityDto extends SearchParamsDto {
}
exports.SearchByCityDto = SearchByCityDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Le nom de ville est requis' }),
    (0, class_validator_1.Length)(2, 100, { message: 'Le nom de ville doit contenir entre 2 et 100 caractères' }),
    __metadata("design:type", String)
], SearchByCityDto.prototype, "city", void 0);
class SearchByRegionDto extends SearchParamsDto {
}
exports.SearchByRegionDto = SearchByRegionDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Le nom de région est requis' }),
    (0, class_validator_1.Length)(2, 100, { message: 'Le nom de région doit contenir entre 2 et 100 caractères' }),
    __metadata("design:type", String)
], SearchByRegionDto.prototype, "region", void 0);
class SearchLogDto {
}
exports.SearchLogDto = SearchLogDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'La requête est requise' }),
    (0, class_validator_1.Length)(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' }),
    __metadata("design:type", String)
], SearchLogDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SearchFiltersDto),
    __metadata("design:type", SearchFiltersDto)
], SearchLogDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'userId doit être un UUID valide' }),
    __metadata("design:type", String)
], SearchLogDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'sessionId est requis' }),
    __metadata("design:type", String)
], SearchLogDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'userAgent est requis' }),
    __metadata("design:type", String)
], SearchLogDto.prototype, "userAgent", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'ipAddress est requis' }),
    __metadata("design:type", String)
], SearchLogDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'resultsCount doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'resultsCount doit être positif ou nul' }),
    __metadata("design:type", Number)
], SearchLogDto.prototype, "resultsCount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'took doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'took doit être positif ou nul' }),
    __metadata("design:type", Number)
], SearchLogDto.prototype, "took", void 0);
class SearchClickDto {
}
exports.SearchClickDto = SearchClickDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'searchLogId doit être un UUID valide' }),
    __metadata("design:type", String)
], SearchClickDto.prototype, "searchLogId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: 'resourceId doit être un UUID valide' }),
    __metadata("design:type", String)
], SearchClickDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'userId doit être un UUID valide' }),
    __metadata("design:type", String)
], SearchClickDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'position doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'position doit être supérieure à 0' }),
    (0, class_validator_1.Max)(1000, { message: 'position maximum est 1000' }),
    __metadata("design:type", Number)
], SearchClickDto.prototype, "position", void 0);
class SavedSearchDto {
}
exports.SavedSearchDto = SavedSearchDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Le nom est requis' }),
    (0, class_validator_1.Length)(1, 100, { message: 'Le nom doit contenir entre 1 et 100 caractères' }),
    __metadata("design:type", String)
], SavedSearchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'La requête est requise' }),
    (0, class_validator_1.Length)(1, 500, { message: 'La requête doit contenir entre 1 et 500 caractères' }),
    __metadata("design:type", String)
], SavedSearchDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SearchFiltersDto),
    __metadata("design:type", SearchFiltersDto)
], SavedSearchDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SavedSearchDto.prototype, "isPublic", void 0);
//# sourceMappingURL=search.dto.js.map