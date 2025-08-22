"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LanguageDetectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageDetectionService = exports.SupportedLanguage = void 0;
const common_1 = require("@nestjs/common");
var SupportedLanguage;
(function (SupportedLanguage) {
    SupportedLanguage["FRENCH"] = "fr";
    SupportedLanguage["ENGLISH"] = "en";
    SupportedLanguage["AUTO"] = "auto";
})(SupportedLanguage || (exports.SupportedLanguage = SupportedLanguage = {}));
let LanguageDetectionService = LanguageDetectionService_1 = class LanguageDetectionService {
    constructor() {
        this.logger = new common_1.Logger(LanguageDetectionService_1.name);
        this.frenchKeywords = new Set([
            'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'à', 'au', 'aux',
            'dans', 'sur', 'avec', 'pour', 'par', 'sans', 'sous', 'entre', 'chez', 'vers',
            'restaurant', 'hôtel', 'service', 'entreprise', 'société', 'boutique', 'magasin',
            'français', 'française', 'douala', 'yaoundé', 'cameroun', 'camerounais'
        ]);
        this.englishKeywords = new Set([
            'the', 'a', 'an', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
            'from', 'up', 'about', 'into', 'over', 'after', 'under', 'between', 'through',
            'restaurant', 'hotel', 'service', 'company', 'business', 'shop', 'store',
            'english', 'american', 'british', 'international', 'global'
        ]);
        this.frenchChars = /[àâäéèêëïîôöùûüÿç]/i;
    }
    detectLanguage(text) {
        if (!text || text.trim().length === 0) {
            return {
                language: SupportedLanguage.FRENCH,
                confidence: 0.5,
                detectedLanguages: [
                    { language: SupportedLanguage.FRENCH, confidence: 0.5 },
                    { language: SupportedLanguage.ENGLISH, confidence: 0.5 }
                ]
            };
        }
        const normalizedText = text.toLowerCase().trim();
        const words = normalizedText.split(/\s+/);
        let frenchScore = 0;
        let englishScore = 0;
        if (this.frenchChars.test(text)) {
            frenchScore += 0.3;
        }
        for (const word of words) {
            if (this.frenchKeywords.has(word)) {
                frenchScore += 0.2;
            }
            if (this.englishKeywords.has(word)) {
                englishScore += 0.2;
            }
        }
        frenchScore += this.calculateFrenchPatterns(normalizedText);
        englishScore += this.calculateEnglishPatterns(normalizedText);
        const totalScore = frenchScore + englishScore;
        if (totalScore > 0) {
            frenchScore = frenchScore / totalScore;
            englishScore = englishScore / totalScore;
        }
        else {
            frenchScore = 0.6;
            englishScore = 0.4;
        }
        const detectedLanguages = [
            { language: SupportedLanguage.FRENCH, confidence: frenchScore },
            { language: SupportedLanguage.ENGLISH, confidence: englishScore }
        ].sort((a, b) => b.confidence - a.confidence);
        const primaryLanguage = detectedLanguages[0];
        this.logger.debug(`Language detection for "${text}": ${primaryLanguage.language} (${primaryLanguage.confidence.toFixed(2)})`);
        return {
            language: primaryLanguage.language,
            confidence: primaryLanguage.confidence,
            detectedLanguages
        };
    }
    calculateFrenchPatterns(text) {
        let score = 0;
        const frenchPatterns = [
            /\b(qu'|d'|l'|n'|s'|t'|j'|m'|c')\w+/g,
            /\b\w+tion\b/g,
            /\b\w+ment\b/g,
            /\b\w+eur\b/g,
            /\b\w+aise?\b/g,
        ];
        for (const pattern of frenchPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                score += matches.length * 0.1;
            }
        }
        return Math.min(score, 0.5);
    }
    calculateEnglishPatterns(text) {
        let score = 0;
        const englishPatterns = [
            /\b\w+ing\b/g,
            /\b\w+ed\b/g,
            /\b\w+ly\b/g,
            /\b\w+tion\b/g,
            /\bth(e|is|at|ere|ey)\b/g,
        ];
        for (const pattern of englishPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                score += matches.length * 0.1;
            }
        }
        return Math.min(score, 0.5);
    }
    getAnalyzerForLanguage(language) {
        switch (language) {
            case SupportedLanguage.FRENCH:
                return 'french_analyzer';
            case SupportedLanguage.ENGLISH:
                return 'english_analyzer';
            case SupportedLanguage.AUTO:
            default:
                return 'multilingual_analyzer';
        }
    }
    getSearchAnalyzerForLanguage(language) {
        switch (language) {
            case SupportedLanguage.FRENCH:
                return 'french_search_analyzer';
            case SupportedLanguage.ENGLISH:
                return 'english_search_analyzer';
            case SupportedLanguage.AUTO:
            default:
                return 'multilingual_analyzer';
        }
    }
    getSearchFieldsForLanguage(language) {
        const baseFields = ['name^3', 'description^2', 'category.name^2', 'tags'];
        switch (language) {
            case SupportedLanguage.FRENCH:
                return [
                    'name.french^3.5',
                    'description.french^2.5',
                    'category.name.french^2.5',
                    'tags.french^1.8',
                    ...baseFields
                ];
            case SupportedLanguage.ENGLISH:
                return [
                    'name.english^3.5',
                    'description.english^2.5',
                    'category.name.english^2.5',
                    'tags.english^1.8',
                    ...baseFields
                ];
            case SupportedLanguage.AUTO:
            default:
                return [
                    'name.french^3.2',
                    'name.english^3.2',
                    'description.french^2.2',
                    'description.english^2.2',
                    'category.name.french^2.2',
                    'category.name.english^2.2',
                    'tags.french^1.6',
                    'tags.english^1.6',
                    ...baseFields
                ];
        }
    }
    isSupportedLanguage(language) {
        return Object.values(SupportedLanguage).includes(language);
    }
};
exports.LanguageDetectionService = LanguageDetectionService;
exports.LanguageDetectionService = LanguageDetectionService = LanguageDetectionService_1 = __decorate([
    (0, common_1.Injectable)()
], LanguageDetectionService);
//# sourceMappingURL=language-detection.service.js.map