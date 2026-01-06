'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, X, Loader2, Plus, Check, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export type LoadOptionsResult<T> = {
  options: DropdownOption<T>[];
  hasMore?: boolean;
};

export interface SearchableDropdownProps<T = string> {
  // Core props
  value?: T | null;
  onChange: (value: T | null, option: DropdownOption<T> | null) => void;

  // Options - either static or async
  options?: DropdownOption<T>[];
  loadOptions?: (query: string, signal: AbortSignal) => Promise<LoadOptionsResult<T>>;

  // UI customization
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;

  // Search behavior
  searchable?: boolean;
  searchDebounceMs?: number;
  minSearchLength?: number;

  // Create new option
  allowCreate?: boolean;
  onCreateOption?: (inputValue: string) => Promise<DropdownOption<T>>;
  createOptionLabel?: (inputValue: string) => string;

  // Custom rendering
  renderOption?: (option: DropdownOption<T>, isHighlighted: boolean, isSelected: boolean) => React.ReactNode;
  renderValue?: (option: DropdownOption<T>) => React.ReactNode;

  // Empty/Loading/Error states (Georgian text)
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  noResultsMessage?: string;

  // Virtualization threshold
  virtualizeThreshold?: number;

  // ARIA
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

type DropdownState = 'idle' | 'loading' | 'error' | 'loaded';

// ============================================================================
// Utility hooks
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ============================================================================
// Virtual List Component (simple implementation for large lists)
// ============================================================================

interface VirtualListProps<T> {
  items: DropdownOption<T>[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: DropdownOption<T>, index: number) => React.ReactNode;
  highlightedIndex: number;
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  highlightedIndex
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (containerRef.current && highlightedIndex >= 0) {
      const itemTop = highlightedIndex * itemHeight;
      const itemBottom = itemTop + itemHeight;
      const viewTop = scrollTop;
      const viewBottom = scrollTop + containerHeight;

      if (itemTop < viewTop) {
        containerRef.current.scrollTop = itemTop;
      } else if (itemBottom > viewBottom) {
        containerRef.current.scrollTop = itemBottom - containerHeight;
      }
    }
  }, [highlightedIndex, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SearchableDropdown<T = string>({
  value,
  onChange,
  options: staticOptions = [],
  loadOptions,
  label,
  placeholder = 'აირჩიეთ...',
  error,
  disabled = false,
  className = '',
  searchable = true,
  searchDebounceMs = 300,
  minSearchLength = 0,
  allowCreate = false,
  onCreateOption,
  createOptionLabel = (input) => `შექმნა "${input}"`,
  renderOption,
  renderValue,
  emptyMessage = 'მონაცემები არ მოიძებნა',
  loadingMessage = 'იტვირთება...',
  errorMessage = 'შეცდომა მოხდა',
  noResultsMessage = 'შედეგი არ მოიძებნა',
  virtualizeThreshold = 100,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SearchableDropdownProps<T>) {
  // ============================================================================
  // State
  // ============================================================================
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [state, setState] = useState<DropdownState>('idle');
  const [asyncOptions, setAsyncOptions] = useState<DropdownOption<T>[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(searchQuery, searchDebounceMs);

  // ============================================================================
  // Computed values
  // ============================================================================

  const isAsync = !!loadOptions;
  const baseOptions = isAsync ? asyncOptions : staticOptions;

  // Filter options based on search query (for static options only)
  const filteredOptions = useMemo(() => {
    if (isAsync) return baseOptions; // Async filtering is done server-side
    if (!searchQuery) return baseOptions;

    const query = searchQuery.toLowerCase();
    return baseOptions.filter(opt =>
      opt.label.toLowerCase().includes(query)
    );
  }, [baseOptions, searchQuery, isAsync]);

  // Find selected option
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined) return null;
    return baseOptions.find(opt => opt.value === value) || null;
  }, [baseOptions, value]);

  // Should show create option?
  const showCreateOption = useMemo(() => {
    if (!allowCreate || !onCreateOption || !searchQuery.trim()) return false;
    // Don't show create if exact match exists
    const query = searchQuery.toLowerCase().trim();
    return !filteredOptions.some(opt => opt.label.toLowerCase() === query);
  }, [allowCreate, onCreateOption, searchQuery, filteredOptions]);

  // Use virtualization for large lists
  const useVirtualization = filteredOptions.length > virtualizeThreshold;

  // ============================================================================
  // Click outside handler
  // ============================================================================

  useClickOutside(containerRef, () => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  });

  // ============================================================================
  // Async loading effect
  // ============================================================================

  useEffect(() => {
    if (!isAsync || !isOpen) return;
    if (debouncedQuery.length < minSearchLength && minSearchLength > 0) {
      setAsyncOptions([]);
      setState('idle');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState('loading');

    loadOptions!(debouncedQuery, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setAsyncOptions(result.options);
          setState('loaded');
          setHighlightedIndex(result.options.length > 0 ? 0 : -1);
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          console.error('SearchableDropdown load error:', err);
          setState('error');
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isAsync, isOpen, loadOptions, minSearchLength]);

  // ============================================================================
  // Keyboard handlers
  // ============================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    const totalItems = filteredOptions.length + (showCreateOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < totalItems - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : totalItems - 1
          );
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          if (showCreateOption && highlightedIndex === filteredOptions.length) {
            handleCreate();
          } else if (filteredOptions[highlightedIndex]) {
            selectOption(filteredOptions[highlightedIndex]);
          }
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(totalItems - 1);
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, filteredOptions, showCreateOption]);

  // ============================================================================
  // Selection handlers
  // ============================================================================

  const selectOption = useCallback((option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!onCreateOption || !searchQuery.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const newOption = await onCreateOption(searchQuery.trim());

      // Add to options list
      if (isAsync) {
        setAsyncOptions(prev => [newOption, ...prev]);
      }

      // Select the new option
      onChange(newOption.value, newOption);
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('Create option error:', err);
      // Keep dropdown open on error
    } finally {
      setIsCreating(false);
    }
  }, [onCreateOption, searchQuery, isCreating, isAsync, onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    setSearchQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  // ============================================================================
  // Open/close handlers
  // ============================================================================

  const handleContainerClick = useCallback(() => {
    if (disabled) return;
    if (!isOpen) {
      setIsOpen(true);
      // Reset highlight on open
      setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
      // Load initial options for async
      if (isAsync && asyncOptions.length === 0) {
        setState('loading');
      }
    }
    inputRef.current?.focus();
  }, [disabled, isOpen, filteredOptions.length, isAsync, asyncOptions.length]);

  // ============================================================================
  // Render option
  // ============================================================================

  const renderOptionItem = useCallback((
    option: DropdownOption<T>,
    index: number
  ) => {
    const isHighlighted = index === highlightedIndex;
    const isSelected = selectedOption?.value === option.value;

    if (renderOption) {
      return (
        <li
          key={String(option.value)}
          role="option"
          aria-selected={isSelected}
          aria-disabled={option.disabled}
          className={`cursor-pointer ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !option.disabled && selectOption(option)}
          onMouseEnter={() => setHighlightedIndex(index)}
        >
          {renderOption(option, isHighlighted, isSelected)}
        </li>
      );
    }

    return (
      <li
        key={String(option.value)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled}
        className={`
          px-3 py-2 cursor-pointer flex items-center justify-between
          ${isHighlighted ? 'bg-green-50' : ''}
          ${isSelected ? 'bg-green-100 text-green-800' : ''}
          ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        `}
        onClick={() => !option.disabled && selectOption(option)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <span className="truncate">{option.label}</span>
        {isSelected && <Check size={16} className="text-green-600 flex-shrink-0 ml-2" />}
      </li>
    );
  }, [highlightedIndex, selectedOption, renderOption, selectOption]);

  // ============================================================================
  // Render dropdown content
  // ============================================================================

  const renderDropdownContent = () => {
    // Loading state
    if (state === 'loading' && isAsync) {
      return (
        <div className="px-3 py-4 text-gray-500 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingMessage}</span>
        </div>
      );
    }

    // Error state
    if (state === 'error') {
      return (
        <div className="px-3 py-4 text-red-500 flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      );
    }

    // Empty state
    if (filteredOptions.length === 0 && !showCreateOption) {
      return (
        <div className="px-3 py-4 text-gray-500 text-center">
          {searchQuery ? noResultsMessage : emptyMessage}
        </div>
      );
    }

    // Options list
    return (
      <>
        {useVirtualization ? (
          <VirtualList
            items={filteredOptions}
            itemHeight={40}
            containerHeight={Math.min(filteredOptions.length * 40, 200)}
            renderItem={renderOptionItem}
            highlightedIndex={highlightedIndex}
          />
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-auto py-1"
            id={id ? `${id}-listbox` : undefined}
          >
            {filteredOptions.map((option, index) => renderOptionItem(option, index))}
          </ul>
        )}

        {/* Create option */}
        {showCreateOption && (
          <div
            role="option"
            className={`
              px-3 py-2 cursor-pointer flex items-center gap-2 border-t
              ${highlightedIndex === filteredOptions.length ? 'bg-green-50' : ''}
              ${isCreating ? 'opacity-50 cursor-wait' : 'hover:bg-gray-50'}
            `}
            onClick={handleCreate}
            onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
          >
            {isCreating ? (
              <Loader2 size={16} className="animate-spin text-green-600" />
            ) : (
              <Plus size={16} className="text-green-600" />
            )}
            <span className="text-green-700 font-medium">
              {createOptionLabel(searchQuery)}
            </span>
          </div>
        )}
      </>
    );
  };

  // ============================================================================
  // Main render
  // ============================================================================

  const inputId = id || `searchable-dropdown-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`mb-4 ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      {/* Main container */}
      <div
        className={`
          relative w-full border rounded-md shadow-sm bg-white
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-green-500 border-green-500' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
        `}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <div className="flex items-center p-2">
          {/* Search input or selected value display */}
          {searchable && isOpen ? (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              className="flex-1 outline-none bg-transparent text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={selectedOption ? selectedOption.label : placeholder}
              disabled={disabled}
              autoComplete="off"
              aria-autocomplete="list"
            />
          ) : (
            <span
              className={`flex-1 text-sm truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}
            >
              {selectedOption ? (
                renderValue ? renderValue(selectedOption) : selectedOption.label
              ) : placeholder}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 ml-2">
            {/* Clear button */}
            {selectedOption && !disabled && (
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded"
                onClick={handleClear}
                aria-label="გასუფთავება"
                tabIndex={-1}
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}

            {/* Dropdown indicator */}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
            style={{ top: '100%', left: 0 }}
          >
            {renderDropdownContent()}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ============================================================================
// Default export
// ============================================================================

export default SearchableDropdown;
