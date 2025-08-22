'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ClockIcon, DocumentIcon, TagIcon } from '@heroicons/react/24/solid';

interface SearchHit {
  _id: string;
  _source: {
    title: string;
    description?: string;
    content?: string;
    tags?: string[];
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    url?: string;
  };
  _score: number;
  highlight?: Record<string, string[]>;
}

interface SearchResultsProps {
  hits: SearchHit[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  query?: string;
  className?: string;
}

export default function SearchResults({
  hits,
  total,
  currentPage,
  pageSize,
  onPageChange,
  isLoading = false,
  query = "",
  className = ""
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) {
      return <span>{text}</span>;
    }
    
    // Simple highlight implementation
    const highlighted = highlights[0];
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{startIndex}</span> à{' '}
              <span className="font-medium">{endIndex}</span> sur{' '}
              <span className="font-medium">{total}</span> résultats
            </p>
          </div>
          
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat trouvé</h3>
        <p className="mt-1 text-sm text-gray-500">
          {query ? `Aucun résultat pour "${query}"` : 'Essayez de modifier vos critères de recherche'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results header */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          {total} résultat{total > 1 ? 's' : ''} {query && `pour "${query}"`}
        </p>
      </div>

      {/* Results list */}
      <div className="space-y-4 mb-6">
        {hits.map((hit) => {
          const source = hit._source;
          const createdDate = formatDate(source.createdAt);
          const updatedDate = formatDate(source.updatedAt);
          
          return (
            <div key={hit._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {source.url ? (
                  <a 
                    href={source.url} 
                    className="hover:text-blue-600 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {highlightText(source.title, hit.highlight?.title)}
                  </a>
                ) : (
                  highlightText(source.title, hit.highlight?.title)
                )}
              </h3>
              
              {/* Description */}
              {source.description && (
                <p className="text-gray-600 mb-3">
                  {highlightText(source.description, hit.highlight?.description)}
                </p>
              )}
              
              {/* Content excerpt */}
              {source.content && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {highlightText(source.content, hit.highlight?.content)}
                </p>
              )}
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                {/* Score */}
                <span className="bg-gray-100 px-2 py-1 rounded">
                  Score: {hit._score.toFixed(2)}
                </span>
                
                {/* Category */}
                {source.category && (
                  <span className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    {source.category}
                  </span>
                )}
                
                {/* Author */}
                {source.author && (
                  <span>Par {source.author}</span>
                )}
                
                {/* Dates */}
                {(createdDate || updatedDate) && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {updatedDate || createdDate}
                  </span>
                )}
              </div>
              
              {/* Tags */}
              {source.tags && source.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {source.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}

// Export types
export type { SearchHit, SearchResultsProps };