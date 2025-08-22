/**
 * Example implementation of advanced suggestion component with keyboard navigation
 * This demonstrates how to implement requirements 3.2, 3.3, 3.4 for task 6.2
 */

import type { Suggestion, SuggestionType } from '../src/modules/search/types/suggestion.types';

// Configuration interface for suggestion component
interface SuggestionConfig {
  minQueryLength: number;
  maxSuggestions: number;
  debounceMs: number;
  enableKeyboardNavigation: boolean;
  autoExecuteOnSelect: boolean;
  highlightMatches: boolean;
  apiEndpoint: string;
}

// Suggestion component state
interface SuggestionState {
  query: string;
  suggestions: Suggestion[];
  selectedIndex: number;
  isVisible: boolean;
  isLoading: boolean;
  error?: string;
}

// Event handlers interface
interface SuggestionEventHandlers {
  onSearch: (query: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}

/**
 * Advanced Suggestion Component with keyboard navigation and auto-execution
 * Implements requirements 3.2, 3.3, 3.4
 */
export class AdvancedSuggestionComponent {
  private config: SuggestionConfig;
  private state: SuggestionState;
  private handlers: SuggestionEventHandlers;
  private debounceTimer?: NodeJS.Timeout;
  private inputElement?: HTMLInputElement;
  private suggestionContainer?: HTMLElement;

  constructor(
    config: Partial<SuggestionConfig> = {},
    handlers: SuggestionEventHandlers
  ) {
    this.config = {
      minQueryLength: 2,
      maxSuggestions: 10,
      debounceMs: 300,
      enableKeyboardNavigation: true,
      autoExecuteOnSelect: true,
      highlightMatches: true,
      apiEndpoint: '/api/v1/search/suggest',
      ...config
    };

    this.state = {
      query: '',
      suggestions: [],
      selectedIndex: -1,
      isVisible: false,
      isLoading: false
    };

    this.handlers = handlers;
  }

  /**
   * Initialize the suggestion component
   */
  init(inputElement: HTMLInputElement, containerElement: HTMLElement): void {
    this.inputElement = inputElement;
    this.suggestionContainer = containerElement;

    this.setupEventListeners();
    this.setupKeyboardNavigation();
  }

  /**
   * Setup event listeners for input and interactions
   */
  private setupEventListeners(): void {
    if (!this.inputElement) return;

    // Input event with debouncing (requirement 3.6)
    this.inputElement.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      this.handleInput(target.value);
    });

    // Focus event to show suggestions
    this.inputElement.addEventListener('focus', () => {
      if (this.state.suggestions.length > 0) {
        this.showSuggestions();
      }
    });

    // Blur event to hide suggestions (with delay for click handling)
    this.inputElement.addEventListener('blur', () => {
      setTimeout(() => this.hideSuggestions(), 150);
    });

    // Click outside to dismiss
    document.addEventListener('click', (event) => {
      if (!this.inputElement?.contains(event.target as Node) &&
          !this.suggestionContainer?.contains(event.target as Node)) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * Setup keyboard navigation (requirement 3.3)
   */
  private setupKeyboardNavigation(): void {
    if (!this.inputElement || !this.config.enableKeyboardNavigation) return;

    this.inputElement.addEventListener('keydown', (event) => {
      if (!this.state.isVisible || this.state.suggestions.length === 0) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.navigateDown();
          break;

        case 'ArrowUp':
          event.preventDefault();
          this.navigateUp();
          break;

        case 'Enter':
          event.preventDefault();
          this.selectCurrentSuggestion();
          break;

        case 'Escape':
          event.preventDefault();
          this.hideSuggestions();
          this.handlers.onDismiss();
          break;

        case 'Tab':
          // Allow tab to select current suggestion
          if (this.state.selectedIndex >= 0) {
            event.preventDefault();
            this.selectCurrentSuggestion();
          }
          break;
      }
    });
  }

  /**
   * Handle input with debouncing
   */
  private handleInput(value: string): void {
    this.state.query = value;

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Hide suggestions if query is too short
    if (value.length < this.config.minQueryLength) {
      this.hideSuggestions();
      return;
    }

    // Debounce the suggestion request
    this.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(value);
    }, this.config.debounceMs);
  }

  /**
   * Fetch suggestions from API
   */
  private async fetchSuggestions(query: string): Promise<void> {
    if (query.length < this.config.minQueryLength) return;

    this.state.isLoading = true;
    this.state.error = undefined;

    try {
      const response = await fetch(
        `${this.config.apiEndpoint}?q=${encodeURIComponent(query)}&limit=${this.config.maxSuggestions}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.state.suggestions = data.data || [];
        this.state.selectedIndex = -1;
        
        if (this.state.suggestions.length > 0) {
          this.showSuggestions();
        } else {
          this.hideSuggestions();
        }
      } else {
        throw new Error(data.error?.message || 'Failed to fetch suggestions');
      }
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.hideSuggestions();
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Navigate down in suggestions list
   */
  private navigateDown(): void {
    if (this.state.suggestions.length === 0) return;

    this.state.selectedIndex = Math.min(
      this.state.selectedIndex + 1,
      this.state.suggestions.length - 1
    );
    
    this.updateSelectedSuggestion();
  }

  /**
   * Navigate up in suggestions list
   */
  private navigateUp(): void {
    if (this.state.suggestions.length === 0) return;

    this.state.selectedIndex = Math.max(this.state.selectedIndex - 1, -1);
    this.updateSelectedSuggestion();
  }

  /**
   * Select current suggestion (requirement 3.4)
   */
  private selectCurrentSuggestion(): void {
    if (this.state.selectedIndex >= 0 && this.state.selectedIndex < this.state.suggestions.length) {
      const selectedSuggestion = this.state.suggestions[this.state.selectedIndex];
      this.selectSuggestion(selectedSuggestion);
    }
  }

  /**
   * Select a specific suggestion
   */
  private selectSuggestion(suggestion: Suggestion): void {
    // Update input value
    if (this.inputElement) {
      this.inputElement.value = suggestion.text;
    }

    // Update state
    this.state.query = suggestion.text;
    this.hideSuggestions();

    // Call selection handler
    this.handlers.onSelect(suggestion);

    // Auto-execute search if enabled (requirement 3.4)
    if (this.config.autoExecuteOnSelect) {
      this.handlers.onSearch(suggestion.text);
    }
  }

  /**
   * Show suggestions container
   */
  private showSuggestions(): void {
    this.state.isVisible = true;
    this.renderSuggestions();
  }

  /**
   * Hide suggestions container
   */
  private hideSuggestions(): void {
    this.state.isVisible = false;
    this.state.selectedIndex = -1;
    
    if (this.suggestionContainer) {
      this.suggestionContainer.style.display = 'none';
      this.suggestionContainer.innerHTML = '';
    }
  }

  /**
   * Update selected suggestion visual state
   */
  private updateSelectedSuggestion(): void {
    if (!this.suggestionContainer) return;

    const items = this.suggestionContainer.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      if (index === this.state.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * Render suggestions with highlighting (requirement 3.2)
   */
  private renderSuggestions(): void {
    if (!this.suggestionContainer || !this.state.isVisible) return;

    this.suggestionContainer.style.display = 'block';
    this.suggestionContainer.innerHTML = '';

    if (this.state.isLoading) {
      this.suggestionContainer.innerHTML = `
        <div class="suggestion-loading">
          <span class="loading-spinner"></span>
          Recherche en cours...
        </div>
      `;
      return;
    }

    if (this.state.error) {
      this.suggestionContainer.innerHTML = `
        <div class="suggestion-error">
          Erreur: ${this.state.error}
        </div>
      `;
      return;
    }

    if (this.state.suggestions.length === 0) {
      this.suggestionContainer.innerHTML = `
        <div class="suggestion-empty">
          Aucune suggestion trouvée
        </div>
      `;
      return;
    }

    // Group suggestions by type for better organization
    const groupedSuggestions = this.groupSuggestionsByType(this.state.suggestions);

    let html = '';
    
    Object.entries(groupedSuggestions).forEach(([type, suggestions]) => {
      if (suggestions.length === 0) return;

      html += `<div class="suggestion-group">`;
      html += `<div class="suggestion-group-header">${this.getTypeLabel(type as SuggestionType)}</div>`;
      
      suggestions.forEach((suggestion, index) => {
        const globalIndex = this.state.suggestions.indexOf(suggestion);
        const isSelected = globalIndex === this.state.selectedIndex;
        const highlightedText = this.config.highlightMatches 
          ? this.highlightMatch(suggestion.text, this.state.query)
          : suggestion.text;

        html += `
          <div class="suggestion-item ${isSelected ? 'selected' : ''}" 
               data-index="${globalIndex}"
               data-type="${suggestion.type}">
            <div class="suggestion-icon">
              ${this.getSuggestionIcon(suggestion)}
            </div>
            <div class="suggestion-content">
              <div class="suggestion-text">${highlightedText}</div>
              ${suggestion.metadata?.description ? 
                `<div class="suggestion-description">${suggestion.metadata.description}</div>` : 
                ''}
              ${suggestion.category ? 
                `<div class="suggestion-category">${suggestion.category}</div>` : 
                ''}
            </div>
            <div class="suggestion-score">${Math.round(suggestion.score * 10) / 10}</div>
          </div>
        `;
      });
      
      html += `</div>`;
    });

    this.suggestionContainer.innerHTML = html;

    // Add click handlers
    this.suggestionContainer.querySelectorAll('.suggestion-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        const index = parseInt((event.currentTarget as HTMLElement).dataset.index || '-1');
        if (index >= 0 && index < this.state.suggestions.length) {
          this.selectSuggestion(this.state.suggestions[index]);
        }
      });

      // Add hover effect for keyboard navigation consistency
      item.addEventListener('mouseenter', (event) => {
        const index = parseInt((event.currentTarget as HTMLElement).dataset.index || '-1');
        this.state.selectedIndex = index;
        this.updateSelectedSuggestion();
      });
    });
  }

  /**
   * Group suggestions by type for better organization
   */
  private groupSuggestionsByType(suggestions: Suggestion[]): Record<string, Suggestion[]> {
    return suggestions.reduce((groups, suggestion) => {
      const type = suggestion.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(suggestion);
      return groups;
    }, {} as Record<string, Suggestion[]>);
  }

  /**
   * Get human-readable label for suggestion type
   */
  private getTypeLabel(type: SuggestionType): string {
    const labels: Record<SuggestionType, string> = {
      [SuggestionType.RESOURCE]: 'Ressources',
      [SuggestionType.CATEGORY]: 'Catégories',
      [SuggestionType.TAG]: 'Tags',
      [SuggestionType.QUERY]: 'Recherches',
      [SuggestionType.LOCATION]: 'Lieux'
    };
    
    return labels[type] || type;
  }

  /**
   * Get icon for suggestion based on type and metadata
   */
  private getSuggestionIcon(suggestion: Suggestion): string {
    const iconMap: Record<string, string> = {
      'api': '🔌',
      'building': '🏢',
      'service': '⚙️',
      'category': '📁',
      'tag': '🏷️',
      'location': '📍',
      'resource': '📄'
    };

    const icon = suggestion.metadata?.icon || suggestion.type;
    return iconMap[icon] || '📄';
  }

  /**
   * Highlight matching text in suggestions
   */
  private highlightMatch(text: string, query: string): string {
    if (!query || !this.config.highlightMatches) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get current state (for external access)
   */
  getState(): Readonly<SuggestionState> {
    return { ...this.state };
  }

  /**
   * Manually trigger suggestion fetch
   */
  async triggerSuggestions(query?: string): Promise<void> {
    const searchQuery = query || this.state.query;
    if (searchQuery.length >= this.config.minQueryLength) {
      await this.fetchSuggestions(searchQuery);
    }
  }

  /**
   * Clear suggestions and hide container
   */
  clear(): void {
    this.state.suggestions = [];
    this.state.query = '';
    this.state.selectedIndex = -1;
    this.hideSuggestions();
    
    if (this.inputElement) {
      this.inputElement.value = '';
    }
  }

  /**
   * Destroy component and cleanup
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.hideSuggestions();
    
    // Remove event listeners would go here in a real implementation
    // This is a simplified example
  }
}

// CSS styles that should be included
export const suggestionStyles = `
.suggestion-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-loading,
.suggestion-error,
.suggestion-empty {
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.suggestion-error {
  color: #d32f2f;
}

.suggestion-group-header {
  padding: 8px 16px;
  background: #f5f5f5;
  font-weight: bold;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
  border-bottom: 1px solid #eee;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background-color: #f0f8ff;
}

.suggestion-item.selected {
  border-left: 3px solid #2196f3;
}

.suggestion-icon {
  margin-right: 12px;
  font-size: 16px;
}

.suggestion-content {
  flex: 1;
}

.suggestion-text {
  font-weight: 500;
  margin-bottom: 2px;
}

.suggestion-text mark {
  background-color: #ffeb3b;
  padding: 0 2px;
  border-radius: 2px;
}

.suggestion-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.suggestion-category {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
}

.suggestion-score {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Usage example
export function createSuggestionExample(): void {
  const inputElement = document.getElementById('search-input') as HTMLInputElement;
  const containerElement = document.getElementById('suggestions-container') as HTMLElement;

  if (!inputElement || !containerElement) {
    console.error('Required elements not found');
    return;
  }

  const suggestionComponent = new AdvancedSuggestionComponent(
    {
      minQueryLength: 2,
      maxSuggestions: 10,
      debounceMs: 300,
      enableKeyboardNavigation: true,
      autoExecuteOnSelect: true,
      highlightMatches: true,
      apiEndpoint: '/api/v1/search/suggest'
    },
    {
      onSearch: (query: string) => {
        console.log('Executing search for:', query);
        // Implement actual search logic here
      },
      onSelect: (suggestion: Suggestion) => {
        console.log('Selected suggestion:', suggestion);
        // Handle suggestion selection
      },
      onDismiss: () => {
        console.log('Suggestions dismissed');
        // Handle dismissal
      }
    }
  );

  suggestionComponent.init(inputElement, containerElement);
}