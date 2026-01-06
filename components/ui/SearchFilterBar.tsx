import React, { useState, useCallback, useId } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { STRINGS } from '../../lib/strings';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
}

export const SearchFilterBar = React.memo<SearchFilterBarProps>(function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = STRINGS.SEARCH_PLACEHOLDER,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filterId = useId();
  const searchId = useId();

  const activeFilterCount = Object.values(filterValues).filter(v => v !== '').length;
  const hasFilters = filters.length > 0;

  const handleClear = useCallback(() => {
    onSearchChange('');
    onClearFilters?.();
  }, [onSearchChange, onClearFilters]);

  const showClearButton = searchValue !== '' || activeFilterCount > 0;

  return (
    <div className="mb-4">
      {/* Search bar row */}
      <div className="flex gap-2">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id={searchId}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={STRINGS.SEARCH}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Filter toggle button - only show if filters exist */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`${filterId}-panel`}
            className={`flex items-center gap-1 px-3 py-2 border rounded-md shadow-sm transition-colors ${
              activeFilterCount > 0
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {STRINGS.FILTER}
            {activeFilterCount > 0 && (
              <span
                className="ml-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                aria-label={`${activeFilterCount} აქტიური ფილტრი`}
              >
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
        )}

        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={STRINGS.CLEAR_FILTERS}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-600 hover:bg-gray-50"
          >
            <X size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{STRINGS.CLEAR_FILTERS}</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      {hasFilters && isExpanded && (
        <div
          id={`${filterId}-panel`}
          className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md"
          role="region"
          aria-label={STRINGS.FILTER}
        >
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => {
              const selectId = `${filterId}-${filter.key}`;
              return (
                <div key={filter.key}>
                  <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {filter.label}
                  </label>
                  <select
                    id={selectId}
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    <option value="">{STRINGS.ALL}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
