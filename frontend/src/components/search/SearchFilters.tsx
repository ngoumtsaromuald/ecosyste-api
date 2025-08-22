'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'date';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

interface SearchFiltersProps {
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAll: () => void;
  className?: string;
}

export default function SearchFilters({
  filterGroups,
  selectedFilters,
  onFilterChange,
  onClearAll,
  className = ""
}: SearchFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleFilterToggle = (groupId: string, optionValue: string, isMultiple: boolean) => {
    const currentValues = selectedFilters[groupId] || [];
    let newValues: string[];

    if (isMultiple) {
      if (currentValues.includes(optionValue)) {
        newValues = currentValues.filter(v => v !== optionValue);
      } else {
        newValues = [...currentValues, optionValue];
      }
    } else {
      newValues = currentValues.includes(optionValue) ? [] : [optionValue];
    }

    onFilterChange(groupId, newValues);
  };

  const getTotalActiveFilters = () => {
    return Object.values(selectedFilters).reduce((total, values) => total + values.length, 0);
  };

  const renderFilterGroup = (group: FilterGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const groupValues = selectedFilters[group.id] || [];
    const isMultiple = group.type === 'checkbox';

    return (
      <div key={group.id} className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleGroup(group.id)}
          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{group.label}</span>
            {groupValues.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {groupValues.length}
              </span>
            )}
          </div>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        {isExpanded && group.options && (
          <div className="px-4 pb-3 space-y-2">
            {group.options.map((option) => {
              const isSelected = groupValues.includes(option.value);
              
              return (
                <label 
                  key={option.id} 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors"
                >
                  <input
                    type={isMultiple ? 'checkbox' : 'radio'}
                    name={group.id}
                    checked={isSelected}
                    onChange={() => handleFilterToggle(group.id, option.value, isMultiple)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-500">({option.count})</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const activeFiltersCount = getTotalActiveFilters();

  return (
    <div className={`relative ${className}`}>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop filters */}
      <div className={`lg:block ${isOpen ? 'block' : 'hidden'} ${isOpen ? 'absolute top-full left-0 right-0 mt-2 z-50' : ''}`}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg lg:shadow-none lg:border-0">
          {/* Filter header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 lg:hidden">
            <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Clear all filters */}
          {activeFiltersCount > 0 && (
            <div className="px-4 py-3 border-b border-gray-200">
              <button
                onClick={onClearAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Effacer tous les filtres ({activeFiltersCount})
              </button>
            </div>
          )}

          {/* Filter groups */}
          <div className="max-h-96 overflow-y-auto">
            {filterGroups.map(renderFilterGroup)}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Export types
export type { FilterOption, FilterGroup, SearchFiltersProps };