"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModuleSimple = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_module_1 = require("./config/database.module");
const search_module_simple_1 = require("./modules/search/search.module.simple");
const search_controller_simple_1 = require("./controllers/search.controller.simple");
const configuration_1 = require("./config/configuration");
let AppModuleSimple = class AppModuleSimple {
};
exports.AppModuleSimple = AppModuleSimple;
exports.AppModuleSimple = AppModuleSimple = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                envFilePath: ['.env.local', '.env'],
            }),
            database_module_1.DatabaseModule,
            search_module_simple_1.SearchModuleSimple,
        ],
        controllers: [
            app_controller_1.AppController,
            search_controller_simple_1.SearchControllerSimple
        ],
        providers: [
            app_service_1.AppService,
        ],
    })
], AppModuleSimple);
//# sourceMappingURL=app.module.simple.js.map