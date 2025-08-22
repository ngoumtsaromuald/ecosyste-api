import { Injectable, Logger } from '@nestjs/common';

export enum SupportedLanguage {
  FRENCH = 'fr',
  ENGLISH = 'en',
  AUTO = 'auto'
}

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  detectedLanguages: Array<{
    language: SupportedLanguage;
    confidence: number;
  }>;
}

@Injectable()
export class LanguageDetectionService {
  private readonly logger = new Logger(LanguageDetectionService.name);

  // Mots-clés français communs
  private readonly frenchKeywords = new Set([
    'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'à', 'au', 'aux',
    'dans', 'sur', 'avec', 'pour', 'par', 'sans', 'sous', 'entre', 'chez', 'vers',
    'restaurant', 'hôtel', 'service', 'entreprise', 'société', 'boutique', 'magasin',
    'français', 'française', 'douala', 'yaoundé', 'cameroun', 'camerounais'
  ]);

  // Mots-clés anglais communs
  private readonly englishKeywords = new Set([
    'the', 'a', 'an', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
    'from', 'up', 'about', 'into', 'over', 'after', 'under', 'between', 'through',
    'restaurant', 'hotel', 'service', 'company', 'business', 'shop', 'store',
    'english', 'american', 'british', 'international', 'global'
  ]);

  // Caractères spécifiques au français
  private readonly frenchChars = /[àâäéèêëïîôöùûüÿç]/i;

  /**
   * Détecte la langue d'un texte de recherche
   */
  detectLanguage(text: string): LanguageDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        language: SupportedLanguage.FRENCH, // Défaut français
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

    // Score basé sur les caractères spéciaux français
    if (this.frenchChars.test(text)) {
      frenchScore += 0.3;
    }

    // Score basé sur les mots-clés
    for (const word of words) {
      if (this.frenchKeywords.has(word)) {
        frenchScore += 0.2;
      }
      if (this.englishKeywords.has(word)) {
        englishScore += 0.2;
      }
    }

    // Patterns spécifiques
    frenchScore += this.calculateFrenchPatterns(normalizedText);
    englishScore += this.calculateEnglishPatterns(normalizedText);

    // Normaliser les scores
    const totalScore = frenchScore + englishScore;
    if (totalScore > 0) {
      frenchScore = frenchScore / totalScore;
      englishScore = englishScore / totalScore;
    } else {
      // Aucun indicateur trouvé, défaut français (contexte camerounais)
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

  /**
   * Calcule le score pour les patterns français
   */
  private calculateFrenchPatterns(text: string): number {
    let score = 0;

    // Patterns grammaticaux français
    const frenchPatterns = [
      /\b(qu'|d'|l'|n'|s'|t'|j'|m'|c')\w+/g, // Élisions
      /\b\w+tion\b/g, // Mots en -tion
      /\b\w+ment\b/g, // Adverbes en -ment
      /\b\w+eur\b/g,  // Mots en -eur
      /\b\w+aise?\b/g, // Adjectifs en -ais/-aise
    ];

    for (const pattern of frenchPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.1;
      }
    }

    return Math.min(score, 0.5); // Limiter le score
  }

  /**
   * Calcule le score pour les patterns anglais
   */
  private calculateEnglishPatterns(text: string): number {
    let score = 0;

    // Patterns grammaticaux anglais
    const englishPatterns = [
      /\b\w+ing\b/g,   // Gérondifs
      /\b\w+ed\b/g,    // Participes passés
      /\b\w+ly\b/g,    // Adverbes en -ly
      /\b\w+tion\b/g,  // Mots en -tion (commun aux deux langues)
      /\bth(e|is|at|ere|ey)\b/g, // Mots avec 'th'
    ];

    for (const pattern of englishPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.1;
      }
    }

    return Math.min(score, 0.5); // Limiter le score
  }

  /**
   * Détermine l'analyseur Elasticsearch approprié selon la langue
   */
  getAnalyzerForLanguage(language: SupportedLanguage): string {
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

  /**
   * Détermine l'analyseur de recherche approprié selon la langue
   */
  getSearchAnalyzerForLanguage(language: SupportedLanguage): string {
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

  /**
   * Obtient les champs de recherche appropriés selon la langue
   */
  getSearchFieldsForLanguage(language: SupportedLanguage): string[] {
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

  /**
   * Valide si une langue est supportée
   */
  isSupportedLanguage(language: string): language is SupportedLanguage {
    return Object.values(SupportedLanguage).includes(language as SupportedLanguage);
  }
}