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
exports.SuggestionEventDto = exports.CreateSuggestionDto = exports.SuggestionParamsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const suggestion_types_1 = require("../types/suggestion.types");
class SuggestionParamsDto {
}
exports.SuggestionParamsDto = SuggestionParamsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100, { message: 'La requête doit contenir entre 2 et 100 caractères' }),
    __metadata("design:type", String)
], SuggestionParamsDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Limite invalide' }),
    (0, class_validator_1.Min)(1, { message: 'La limite doit être supérieure à 0' }),
    (0, class_validator_1.Max)(20, { message: 'Limite maximum de 20 suggestions' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], SuggestionParamsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(suggestion_types_1.SuggestionType, { each: true, message: 'Type de suggestion invalide' }),
    (0, class_validator_1.ArrayMaxSize)(5, { message: 'Maximum 5 types de suggestions autorisés' }),
    __metadata("design:type", Array)
], SuggestionParamsDto.prototype, "types", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'ID utilisateur invalide' }),
    __metadata("design:type", String)
], SuggestionParamsDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SuggestionParamsDto.prototype, "includePopular", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SuggestionParamsDto.prototype, "includeRecent", void 0);
class CreateSuggestionDto {
}
exports.CreateSuggestionDto = CreateSuggestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200, { message: 'Le texte doit contenir entre 1 et 200 caractères' }),
    __metadata("design:type", String)
], CreateSuggestionDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(suggestion_types_1.SuggestionType, { message: 'Type de suggestion invalide' }),
    __metadata("design:type", String)
], CreateSuggestionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Score invalide' }),
    (0, class_validator_1.Min)(0, { message: 'Le score doit être positif' }),
    (0, class_validator_1.Max)(100, { message: 'Score maximum de 100' }),
    __metadata("design:type", Number)
], CreateSuggestionDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100, { message: 'Catégorie invalide' }),
    __metadata("design:type", String)
], CreateSuggestionDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 50, { message: 'Type de ressource invalide' }),
    __metadata("design:type", String)
], CreateSuggestionDto.prototype, "resourceType", void 0);
class SuggestionEventDto {
}
exports.SuggestionEventDto = SuggestionEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200, { message: 'Texte de suggestion invalide' }),
    __metadata("design:type", String)
], SuggestionEventDto.prototype, "suggestionText", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(suggestion_types_1.SuggestionType, { message: 'Type de suggestion invalide' }),
    __metadata("design:type", String)
], SuggestionEventDto.prototype, "suggestionType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200, { message: 'Requête invalide' }),
    __metadata("design:type", String)
], SuggestionEventDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'ID utilisateur invalide' }),
    __metadata("design:type", String)
], SuggestionEventDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestionEventDto.prototype, "sessionId", void 0);
//# sourceMappingURL=suggestion.dto.js.map