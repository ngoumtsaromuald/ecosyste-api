"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SearchServiceSimple_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchServiceSimple = void 0;
const common_1 = require("@nestjs/common");
let SearchServiceSimple = SearchServiceSimple_1 = class SearchServiceSimple {
    constructor() {
        this.logger = new common_1.Logger(SearchServiceSimple_1.name);
    }
    async search(params) {
        const startTime = Date.now();
        try {
            this.logger.log(`Performing search with params: ${JSON.stringify(params)}`);
            const results = {
                query: params.query || '',
                results: [
                    {
                        id: '1',
                        name: 'API Example 1',
                        description: 'This is a test API result',
                        category: 'Test',
                        type: 'API'
                    },
                    {
                        id: '2',
                        name: 'Service Example 2',
                        description: 'This is a test service result',
                        category: 'Test',
                        type: 'Service'
                    }
                ],
                total: 2,
                limit: params.limit || 20,
                offset: params.offset || 0,
                took: Date.now() - startTime
            };
            this.logger.log(`Search completed in ${results.took}ms`);
            return results;
        }
        catch (error) {
            this.logger.error('Search error:', error);
            throw error;
        }
    }
    async health() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                search: 'operational'
            }
        };
    }
};
exports.SearchServiceSimple = SearchServiceSimple;
exports.SearchServiceSimple = SearchServiceSimple = SearchServiceSimple_1 = __decorate([
    (0, common_1.Injectable)()
], SearchServiceSimple);
//# sourceMappingURL=search.service.simple.js.map