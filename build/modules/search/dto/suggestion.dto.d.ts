import { SuggestionType } from '../types/suggestion.types';
export declare class SuggestionParamsDto {
    query: string;
    limit?: number;
    types?: SuggestionType[];
    userId?: string;
    includePopular?: boolean;
    includeRecent?: boolean;
}
export declare class CreateSuggestionDto {
    text: string;
    type: SuggestionType;
    score: number;
    category?: string;
    resourceType?: string;
}
export declare class SuggestionEventDto {
    suggestionText: string;
    suggestionType: SuggestionType;
    query: string;
    userId?: string;
    sessionId: string;
}
