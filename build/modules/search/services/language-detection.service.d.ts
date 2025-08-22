export declare enum SupportedLanguage {
    FRENCH = "fr",
    ENGLISH = "en",
    AUTO = "auto"
}
export interface LanguageDetectionResult {
    language: SupportedLanguage;
    confidence: number;
    detectedLanguages: Array<{
        language: SupportedLanguage;
        confidence: number;
    }>;
}
export declare class LanguageDetectionService {
    private readonly logger;
    private readonly frenchKeywords;
    private readonly englishKeywords;
    private readonly frenchChars;
    detectLanguage(text: string): LanguageDetectionResult;
    private calculateFrenchPatterns;
    private calculateEnglishPatterns;
    getAnalyzerForLanguage(language: SupportedLanguage): string;
    getSearchAnalyzerForLanguage(language: SupportedLanguage): string;
    getSearchFieldsForLanguage(language: SupportedLanguage): string[];
    isSupportedLanguage(language: string): language is SupportedLanguage;
}
