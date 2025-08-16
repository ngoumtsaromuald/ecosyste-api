"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseInterceptor = class ResponseInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, operators_1.map)((data) => {
            const baseResponse = {
                success: true,
                meta: {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    method: request.method,
                    version: process.env.API_VERSION || '1.0.0',
                },
            };
            if (this.isPaginatedResponse(data)) {
                return {
                    ...baseResponse,
                    data: data.items,
                    pagination: {
                        page: data.page,
                        limit: data.limit,
                        total: data.total,
                        totalPages: Math.ceil(data.total / data.limit),
                        hasNext: data.page * data.limit < data.total,
                        hasPrev: data.page > 1,
                    },
                };
            }
            return {
                ...baseResponse,
                data,
            };
        }));
    }
    isPaginatedResponse(data) {
        return (data &&
            typeof data === 'object' &&
            Array.isArray(data.items) &&
            typeof data.page === 'number' &&
            typeof data.limit === 'number' &&
            typeof data.total === 'number');
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseInterceptor);
//# sourceMappingURL=response.interceptor.js.map