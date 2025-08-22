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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SearchControllerSimple_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchControllerSimple = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_simple_1 = require("../modules/search/services/search.service.simple");
let SearchControllerSimple = SearchControllerSimple_1 = class SearchControllerSimple {
    constructor(searchService) {
        this.searchService = searchService;
        this.logger = new common_1.Logger(SearchControllerSimple_1.name);
    }
    async search(query, limit, offset) {
        try {
            this.logger.log(`Search request: query="${query}", limit=${limit}, offset=${offset}`);
            const results = await this.searchService.search({
                query,
                limit,
                offset
            });
            return {
                success: true,
                data: results,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Search error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async health() {
        try {
            const healthStatus = await this.searchService.health();
            return {
                success: true,
                data: healthStatus,
                message: 'All search services are operational! ✅'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Search service health check failed'
            };
        }
    }
};
exports.SearchControllerSimple = SearchControllerSimple;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Recherche de base' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Résultats de recherche' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], SearchControllerSimple.prototype, "search", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Vérification de santé du système de recherche' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut de santé' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchControllerSimple.prototype, "health", null);
exports.SearchControllerSimple = SearchControllerSimple = SearchControllerSimple_1 = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)('api/v1/search'),
    __metadata("design:paramtypes", [search_service_simple_1.SearchServiceSimple])
], SearchControllerSimple);
//# sourceMappingURL=search.controller.simple.js.map