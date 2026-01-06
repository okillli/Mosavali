/**
 * SearchableDropdown Component - Usage Examples
 *
 * A comprehensive dropdown component with:
 * - Inline search (typeahead filtering)
 * - Inline "add new item" capability
 * - A11y-compliant ARIA combobox behavior
 * - Virtualized list rendering for large option sets (100+ items)
 * - Keyboard navigation (Arrow keys, Enter, Esc, Tab)
 * - Async loading support with debounced queries
 * - Clear empty/loading/error states
 */

import React, { useState, useCallback } from 'react';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';
import { supabase } from '../../lib/supabaseClient';
import { STRINGS } from '../../lib/strings';

// ============================================================================
// Example 1: Basic Static Options
// ============================================================================

export function BasicExample() {
  const [value, setValue] = useState<string | null>(null);

  const options: DropdownOption<string>[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  return (
    <SearchableDropdown
      label="Basic Dropdown"
      value={value}
      onChange={(val) => setValue(val)}
      options={options}
      placeholder={STRINGS.SELECT_OPTION}
    />
  );
}

// ============================================================================
// Example 2: With Create New Option (Buyer Selection)
// ============================================================================

interface Buyer {
  id: string;
  name: string;
}

export function CreateNewExample() {
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
  ]);

  const buyerOptions: DropdownOption<string>[] = buyers.map(b => ({
    value: b.id,
    label: b.name,
  }));

  const handleCreateBuyer = useCallback(async (name: string): Promise<DropdownOption<string>> => {
    // In real app, this would call Supabase
    const newBuyer: Buyer = {
      id: String(Date.now()),
      name,
    };

    // Add to local state
    setBuyers(prev => [...prev, newBuyer]);

    return {
      value: newBuyer.id,
      label: newBuyer.name,
    };
  }, []);

  return (
    <SearchableDropdown
      label={STRINGS.BUYER}
      value={buyerId}
      onChange={(val) => setBuyerId(val)}
      options={buyerOptions}
      placeholder={STRINGS.SELECT_OPTION}
      searchable={true}
      allowCreate={true}
      onCreateOption={handleCreateBuyer}
      createOptionLabel={(name) => `${STRINGS.DROPDOWN_CREATE} "${name}"`}
      emptyMessage={STRINGS.DROPDOWN_NO_DATA}
      noResultsMessage={STRINGS.DROPDOWN_NO_RESULTS}
    />
  );
}

// ============================================================================
// Example 3: Async Loading (Remote Search)
// ============================================================================

export function AsyncExample() {
  const [value, setValue] = useState<string | null>(null);

  const loadOptions = useCallback(async (query: string, signal: AbortSignal) => {
    // Simulate API call to Supabase
    const { data, error } = await supabase
      .from('buyers')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(50);

    if (signal.aborted) {
      throw new Error('Aborted');
    }

    if (error) {
      throw error;
    }

    return {
      options: (data || []).map(b => ({
        value: b.id,
        label: b.name,
      })),
      hasMore: false,
    };
  }, []);

  return (
    <SearchableDropdown
      label="Async Buyer Search"
      value={value}
      onChange={(val) => setValue(val)}
      loadOptions={loadOptions}
      searchDebounceMs={300}
      minSearchLength={1}
      placeholder="Type to search..."
      loadingMessage={STRINGS.DROPDOWN_LOADING}
      errorMessage={STRINGS.DROPDOWN_ERROR}
    />
  );
}

// ============================================================================
// Example 4: Custom Option Rendering
// ============================================================================

interface CustomOption {
  id: string;
  name: string;
  phone?: string;
}

export function CustomRenderingExample() {
  const [value, setValue] = useState<string | null>(null);

  const options: DropdownOption<string>[] = [
    { value: '1', label: 'John Doe - 555-0100' },
    { value: '2', label: 'Jane Smith - 555-0101' },
  ];

  return (
    <SearchableDropdown
      label="Custom Rendering"
      value={value}
      onChange={(val) => setValue(val)}
      options={options}
      renderOption={(option, isHighlighted, isSelected) => (
        <div className={`
          px-3 py-2 flex items-center justify-between
          ${isHighlighted ? 'bg-blue-50' : ''}
          ${isSelected ? 'bg-blue-100' : ''}
        `}>
          <div>
            <div className="font-medium">{option.label.split(' - ')[0]}</div>
            <div className="text-xs text-gray-500">{option.label.split(' - ')[1]}</div>
          </div>
          {isSelected && <span>✓</span>}
        </div>
      )}
    />
  );
}

// ============================================================================
// Example 5: Disabled Options
// ============================================================================

export function DisabledOptionsExample() {
  const [value, setValue] = useState<string | null>(null);

  const options: DropdownOption<string>[] = [
    { value: '1', label: 'Available Option 1' },
    { value: '2', label: 'Disabled Option', disabled: true },
    { value: '3', label: 'Available Option 2' },
  ];

  return (
    <SearchableDropdown
      label="With Disabled Options"
      value={value}
      onChange={(val) => setValue(val)}
      options={options}
    />
  );
}

// ============================================================================
// Example 6: Large List with Virtualization
// ============================================================================

export function VirtualizedExample() {
  const [value, setValue] = useState<string | null>(null);

  // Generate 1000 options
  const options: DropdownOption<string>[] = Array.from({ length: 1000 }, (_, i) => ({
    value: String(i + 1),
    label: `Option ${i + 1}`,
  }));

  return (
    <SearchableDropdown
      label="Large List (1000 items)"
      value={value}
      onChange={(val) => setValue(val)}
      options={options}
      virtualizeThreshold={100} // Virtualize when > 100 options
      searchable={true}
    />
  );
}

// ============================================================================
// Example 7: Form Integration
// ============================================================================

interface FormData {
  buyerId: string;
  // ... other fields
}

export function FormIntegrationExample() {
  const [formData, setFormData] = useState<FormData>({
    buyerId: '',
  });

  const options: DropdownOption<string>[] = [
    { value: '1', label: 'Buyer 1' },
    { value: '2', label: 'Buyer 2' },
  ];

  const handleBuyerChange = useCallback((value: string | null) => {
    setFormData(prev => ({
      ...prev,
      buyerId: value || '',
    }));
  }, []);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <SearchableDropdown
        label={STRINGS.BUYER}
        value={formData.buyerId || null}
        onChange={handleBuyerChange}
        options={options}
        error={!formData.buyerId ? STRINGS.REQUIRED_FIELD : undefined}
      />
      <button
        type="submit"
        disabled={!formData.buyerId}
      >
        {STRINGS.SAVE}
      </button>
    </form>
  );
}

// ============================================================================
// Example 8: Georgian Localization (Default)
// ============================================================================

export function GeorgianLocalizedExample() {
  const [value, setValue] = useState<string | null>(null);

  const options: DropdownOption<string>[] = [
    { value: '1', label: 'გიორგი ბერიძე' },
    { value: '2', label: 'მარიამ კაპანაძე' },
  ];

  return (
    <SearchableDropdown
      label={STRINGS.BUYER}
      value={value}
      onChange={(val) => setValue(val)}
      options={options}
      placeholder={STRINGS.SELECT_OPTION}
      searchable={true}
      allowCreate={true}
      onCreateOption={async (name) => ({
        value: String(Date.now()),
        label: name,
      })}
      createOptionLabel={(name) => `${STRINGS.DROPDOWN_CREATE} "${name}"`}
      emptyMessage={STRINGS.DROPDOWN_NO_DATA}
      loadingMessage={STRINGS.DROPDOWN_LOADING}
      errorMessage={STRINGS.DROPDOWN_ERROR}
      noResultsMessage={STRINGS.DROPDOWN_NO_RESULTS}
    />
  );
}

// ============================================================================
// Props Reference
// ============================================================================

/**
 * SearchableDropdownProps<T>
 *
 * Core Props:
 * - value: T | null - Current selected value
 * - onChange: (value: T | null, option: DropdownOption<T> | null) => void - Selection handler
 *
 * Options:
 * - options: DropdownOption<T>[] - Static options array
 * - loadOptions: (query: string, signal: AbortSignal) => Promise<LoadOptionsResult<T>> - Async loader
 *
 * UI:
 * - label: string - Field label
 * - placeholder: string - Placeholder text (default: "აირჩიეთ...")
 * - error: string - Error message to display
 * - disabled: boolean - Disable the dropdown
 * - className: string - Additional CSS classes
 *
 * Search:
 * - searchable: boolean - Enable search input (default: true)
 * - searchDebounceMs: number - Debounce delay for async search (default: 300)
 * - minSearchLength: number - Minimum chars before async search (default: 0)
 *
 * Create:
 * - allowCreate: boolean - Show "create new" option
 * - onCreateOption: (inputValue: string) => Promise<DropdownOption<T>> - Create handler
 * - createOptionLabel: (inputValue: string) => string - Label for create option
 *
 * Custom Rendering:
 * - renderOption: (option, isHighlighted, isSelected) => ReactNode
 * - renderValue: (option) => ReactNode
 *
 * State Messages (Georgian defaults):
 * - emptyMessage: string - "მონაცემები არ მოიძებნა"
 * - loadingMessage: string - "იტვირთება..."
 * - errorMessage: string - "შეცდომა მოხდა"
 * - noResultsMessage: string - "შედეგი არ მოიძებნა"
 *
 * Performance:
 * - virtualizeThreshold: number - Enable virtualization above N items (default: 100)
 *
 * Accessibility:
 * - id: string - Element ID
 * - aria-label: string - ARIA label
 * - aria-labelledby: string - ARIA labelledby
 */
