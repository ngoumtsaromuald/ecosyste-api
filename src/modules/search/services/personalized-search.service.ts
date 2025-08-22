import { Injectable, Logger } from '@nestjs/common';
import { SearchParams, SearchResults, SearchFilters } from '../interfaces/search.interfaces';
import { SearchAnalyticsService } from './search-analytics.service';
import { ISearchService } from '../interfaces/search-service.interface';

export interface UserPreferences {
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    searchCount: number;
    weight: number;
  }>;
  topTerms: Array<{
    term: string;
    count: number;
    weight: number;
  }>;
  recentSearches: Array<{
    query: string;
    filters: any;
    createdAt: Date;
    resultsCount: number;
  }>;
  clickedResources: Array<{
    resourceId: string;
    clickCount: number;
    lastClicked: Date;
    weight: number;
  }>;
}

export interface PersonalizedSearchParams extends SearchParams {
  userId: string;
  usePersonalization?: boolean;
  personalizationWeight?: number; // 0.0 to 1.0, default 0.3
}

@Injectable()
export class PersonalizedSearchService {
  private readonly logger = new Logger(PersonalizedSearchService.name);

  constructor(
    private readonly analyticsService: SearchAnalyticsService,
  ) {}

  /**
   * Obtenir les préférences utilisateur basées sur l'historique
   * Requirements: 10.1, 10.2
   */
  async getUserPreferences(userId: string, lookbackDays: number = 90): Promise<UserPreferences> {
    try {
      this.logger.debug(`Getting user preferences for user: ${userId}`);

      // Récupérer l'historique de recherche depuis SearchAnalyticsService
      const history = await this.analyticsService.getUserSearchHistory(userId, 200);

      // Calculer les poids basés sur la récence et la fréquence
      const now = new Date();
      const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;

      // Filtrer les recherches récentes
      const recentSearches = history.searches.filter(search => 
        (now.getTime() - search.createdAt.getTime()) <= lookbackMs
      );

      // Calculer les poids pour les catégories
      const topCategories = history.topCategories.map(cat => ({
        ...cat,
        weight: this.calculateCategoryWeight(cat.searchCount, history.topCategories.length)
      }));

      // Calculer les poids pour les termes
      const topTerms = history.topTerms.map(term => ({
        ...term,
        weight: this.calculateTermWeight(term.count, history.topTerms.length)
      }));

      // Obtenir les ressources cliquées (simulé pour l'instant)
      const clickedResources = await this.getClickedResources(userId, lookbackDays);

      return {
        topCategories,
        topTerms,
        recentSearches,
        clickedResources
      };

    } catch (error) {
      this.logger.error(`Failed to get user preferences for ${userId}: ${error.message}`);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Appliquer la personnalisation aux paramètres de recherche
   * Requirements: 10.1, 10.2
   */
  async personalizeSearchParams(params: PersonalizedSearchParams): Promise<SearchParams> {
    try {
      if (!params.usePersonalization || !params.userId) {
        return params;
      }

      const preferences = await this.getUserPreferences(params.userId);
      const personalizationWeight = params.personalizationWeight || 0.3;

      this.logger.debug(`Personalizing search for user ${params.userId} with weight ${personalizationWeight}`);

      // Enrichir les filtres avec les préférences utilisateur
      const personalizedFilters = this.applyPersonalizationToFilters(
        params.filters || {},
        preferences,
        personalizationWeight
      );

      // Enrichir la requête avec les termes préférés
      const personalizedQuery = this.applyPersonalizationToQuery(
        params.query || '',
        preferences,
        personalizationWeight
      );

      return {
        ...params,
        query: personalizedQuery,
        filters: personalizedFilters
      };

    } catch (error) {
      this.logger.error(`Failed to personalize search params: ${error.message}`);
      return params; // Fallback vers paramètres originaux
    }
  }

  /**
   * Appliquer la personnalisation au scoring des résultats
   * Requirements: 10.1, 10.2
   */
  async personalizeSearchResults(
    results: SearchResults,
    userId: string,
    personalizationWeight: number = 0.3
  ): Promise<SearchResults> {
    try {
      if (!userId || results.hits.length === 0) {
        return results;
      }

      const preferences = await this.getUserPreferences(userId);

      this.logger.debug(`Personalizing ${results.hits.length} search results for user ${userId}`);

      // Appliquer le boost de personnalisation à chaque résultat
      const personalizedHits = results.hits.map(hit => {
        const personalizedScore = this.calculatePersonalizedScore(
          hit,
          preferences,
          personalizationWeight
        );

        return {
          ...hit,
          score: personalizedScore
        };
      });

      // Re-trier par score personnalisé
      personalizedHits.sort((a, b) => b.score - a.score);

      return {
        ...results,
        hits: personalizedHits
      };

    } catch (error) {
      this.logger.error(`Failed to personalize search results: ${error.message}`);
      return results; // Fallback vers résultats originaux
    }
  }

  /**
   * Calculer le poids d'une catégorie basé sur la fréquence
   */
  private calculateCategoryWeight(searchCount: number, totalCategories: number): number {
    // Normaliser entre 0.1 et 1.0
    const maxWeight = 1.0;
    const minWeight = 0.1;
    
    // Plus la catégorie est recherchée, plus le poids est élevé
    const normalizedCount = Math.min(searchCount / 10, 1.0); // Cap à 10 recherches
    
    return minWeight + (normalizedCount * (maxWeight - minWeight));
  }

  /**
   * Calculer le poids d'un terme basé sur la fréquence
   */
  private calculateTermWeight(count: number, totalTerms: number): number {
    const maxWeight = 1.0;
    const minWeight = 0.1;
    
    const normalizedCount = Math.min(count / 5, 1.0); // Cap à 5 occurrences
    
    return minWeight + (normalizedCount * (maxWeight - minWeight));
  }

  /**
   * Obtenir les ressources cliquées par l'utilisateur
   */
  private async getClickedResources(userId: string, lookbackDays: number): Promise<Array<{
    resourceId: string;
    clickCount: number;
    lastClicked: Date;
    weight: number;
  }>> {
    try {
      // Cette méthode devrait être implémentée dans SearchAnalyticsService
      // Pour l'instant, retourner un tableau vide
      return [];
    } catch (error) {
      this.logger.error(`Failed to get clicked resources for ${userId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Appliquer la personnalisation aux filtres
   */
  private applyPersonalizationToFilters(
    filters: SearchFilters,
    preferences: UserPreferences,
    weight: number
  ): SearchFilters {
    const personalizedFilters = { ...filters };

    // Si aucune catégorie n'est spécifiée, suggérer les catégories préférées
    if (!filters.categories || filters.categories.length === 0) {
      if (preferences.topCategories.length > 0 && weight > 0.5) {
        // Seulement si le poids de personnalisation est élevé
        personalizedFilters.categories = preferences.topCategories
          .slice(0, 3) // Top 3 catégories
          .map(cat => cat.categoryId);
      }
    }

    return personalizedFilters;
  }

  /**
   * Appliquer la personnalisation à la requête
   */
  private applyPersonalizationToQuery(
    query: string,
    preferences: UserPreferences,
    weight: number
  ): string {
    // Si la requête est vide et que la personnalisation est forte
    if (!query && weight > 0.7 && preferences.topTerms.length > 0) {
      // Utiliser le terme le plus fréquent
      return preferences.topTerms[0].term;
    }

    return query;
  }

  /**
   * Calculer le score personnalisé d'un résultat
   */
  private calculatePersonalizedScore(
    hit: any,
    preferences: UserPreferences,
    weight: number
  ): number {
    let boost = 0;

    // Boost basé sur les catégories préférées
    const categoryBoost = this.calculateCategoryBoost(hit, preferences.topCategories);
    boost += categoryBoost * weight * 0.4;

    // Boost basé sur les ressources cliquées
    const clickBoost = this.calculateClickBoost(hit, preferences.clickedResources);
    boost += clickBoost * weight * 0.6;

    // Appliquer le boost au score original
    return hit.score * (1 + boost);
  }

  /**
   * Calculer le boost basé sur les catégories préférées
   */
  private calculateCategoryBoost(hit: any, topCategories: UserPreferences['topCategories']): number {
    const categoryMatch = topCategories.find(cat => cat.categoryId === hit.category.id);
    
    if (categoryMatch) {
      return categoryMatch.weight * 0.5; // Boost jusqu'à 50%
    }

    return 0;
  }

  /**
   * Calculer le boost basé sur les clics précédents
   */
  private calculateClickBoost(hit: any, clickedResources: UserPreferences['clickedResources']): number {
    const clickMatch = clickedResources.find(res => res.resourceId === hit.id);
    
    if (clickMatch) {
      return clickMatch.weight * 0.3; // Boost jusqu'à 30%
    }

    return 0;
  }

  /**
   * Obtenir les raisons de la personnalisation
   */
  private getPersonalizationReasons(hit: any, preferences: UserPreferences): string[] {
    const reasons: string[] = [];

    // Vérifier les catégories
    const categoryMatch = preferences.topCategories.find(cat => cat.categoryId === hit.category.id);
    if (categoryMatch) {
      reasons.push(`Catégorie préférée: ${categoryMatch.categoryName}`);
    }

    // Vérifier les clics précédents
    const clickMatch = preferences.clickedResources.find(res => res.resourceId === hit.id);
    if (clickMatch) {
      reasons.push(`Ressource consultée ${clickMatch.clickCount} fois`);
    }

    return reasons;
  }

  /**
   * Calculer le boost moyen appliqué
   */
  private calculateAverageBoost(hits: any[]): number {
    if (hits.length === 0) return 0;

    const totalBoost = hits.reduce((sum, hit) => {
      const personalization = hit.metadata?.personalization;
      return sum + (personalization?.boost || 0);
    }, 0);

    return totalBoost / hits.length;
  }

  /**
   * Obtenir les préférences par défaut
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      topCategories: [],
      topTerms: [],
      recentSearches: [],
      clickedResources: []
    };
  }
}