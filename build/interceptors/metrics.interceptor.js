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
exports.MetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const metrics_service_1 = require("../services/metrics.service");
let MetricsInterceptor = class MetricsInterceptor {
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    intercept(context, next) {
        const startTime = Date.now();
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const method = request.method;
        const route = this.getRoute(context, request);
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                this.metricsService.recordHttpRequest(method, route, response.statusCode, duration);
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                const statusCode = error.status || 500;
                this.metricsService.recordHttpRequest(method, route, statusCode, duration);
            },
        }));
    }
    getRoute(context, request) {
        const handler = context.getHandler();
        const controller = context.getClass();
        const routePath = Reflect.getMetadata('path', handler);
        const controllerPath = Reflect.getMetadata('path', controller);
        if (routePath && controllerPath) {
            return `${controllerPath}${routePath}`.replace(/\/+/g, '/');
        }
        const path = request.route?.path || request.path;
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id')
            .replace(/\/[^\/]+\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i, '/:file');
    }
};
exports.MetricsInterceptor = MetricsInterceptor;
exports.MetricsInterceptor = MetricsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsInterceptor);
//# sourceMappingURL=metrics.interceptor.js.map