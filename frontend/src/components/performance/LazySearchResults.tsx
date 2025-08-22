'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { SearchResult } from '../../services/searchApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  User, 
  Tag, 
  ExternalLink, 
  BookOpen,
  Clock,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazySearchResultsProps {
  results: SearchResult[];
  searchQuery: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
  itemsPerBatch?: number;
}

// Memoized result item component for performance
const SearchResultItem = React.memo(({ 
  result, 
  searchQuery, 
  isVisible 
}: { 
  result: SearchResult; 
  searchQuery: string;
  isVisible: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Highlight search terms in text
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Don't render if not visible (virtual scrolling)
  if (!isVisible) {
    return <div className="h-48" />; // Placeholder height
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 group">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 
                className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
                dangerouslySetInnerHTML={{ 
                  __html: highlightText(result.title, searchQuery) 
                }}
              />
              {result.description && (
                <p 
                  className="text-gray-600 mt-1 line-clamp-2"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightText(result.description, searchQuery) 
                  }}
                />
              )}
            </div>
            
            {/* Score badge */}
            <Badge variant="secondary" className="ml-4">
              Score: {result.score.toFixed(2)}
            </Badge>
          </div>

          {/* Content preview */}
          {result.content && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p 
                className="text-sm text-gray-700 line-clamp-3"
                dangerouslySetInnerHTML={{ 
                  __html: highlightText(result.content.substring(0, 200) + '...', searchQuery) 
                }}
              />
            </div>
          )}

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              {result.tags.slice(0, 5).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 5 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{result.tags.length - 5} autres
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {result.category && (
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{result.category}</span>
                </div>
              )}
              
              {result.author && (
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{result.author}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {result.createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(result.createdAt)}</span>
                </div>
              )}
              
              {result.updatedAt && result.updatedAt !== result.createdAt && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Modifié {formatDate(result.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Voir détails
              </Button>
              
              {result.url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ouvrir
                  </a>
                </Button>
              )}
            </div>
            
            <div className="text-xs text-gray-400">
              ID: {result.id}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SearchResultItem.displayName = 'SearchResultItem';

// Loading skeleton component
const ResultSkeleton = React.memo(() => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </CardContent>
  </Card>
));

ResultSkeleton.displayName = 'ResultSkeleton';

// Main component with virtual scrolling and lazy loading
export default function LazySearchResults({
  results,
  searchQuery,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className = '',
  itemsPerBatch = 10
}: LazySearchResultsProps) {
  const [visibleItems, setVisibleItems] = useState(itemsPerBatch);
  const [loadMoreRef, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Load more items when scrolling near bottom
  useEffect(() => {
    if (inView && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, onLoadMore, isLoading]);

  // Increase visible items when scrolling
  useEffect(() => {
    if (inView && visibleItems < results.length) {
      setVisibleItems(prev => Math.min(prev + itemsPerBatch, results.length));
    }
  }, [inView, visibleItems, results.length, itemsPerBatch]);

  // Memoize visible results to prevent unnecessary re-renders
  const visibleResults = useMemo(() => {
    return results.slice(0, visibleItems);
  }, [results, visibleItems]);

  // Reset visible items when results change (new search)
  useEffect(() => {
    setVisibleItems(itemsPerBatch);
  }, [searchQuery, itemsPerBatch]);

  if (results.length === 0 && !isLoading) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Aucun résultat trouvé</p>
          <p className="text-sm">Essayez de modifier vos termes de recherche ou vos filtres</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results */}
      {visibleResults.map((result, index) => (
        <SearchResultItem
          key={`${result.id}-${index}`}
          result={result}
          searchQuery={searchQuery}
          isVisible={true}
        />
      ))}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <ResultSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Load more trigger */}
      {(hasMore || visibleItems < results.length) && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Chargement...</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => {
                if (visibleItems < results.length) {
                  setVisibleItems(prev => Math.min(prev + itemsPerBatch, results.length));
                } else if (onLoadMore) {
                  onLoadMore();
                }
              }}
            >
              Charger plus de résultats
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Export types
export type { LazySearchResultsProps };