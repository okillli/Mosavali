'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Field } from '../../../types';
import { SearchFilterBar, FilterConfig } from '../../../components/ui';

export default function FieldsList() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    ownership: '',
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const { data, error: fetchError } = await supabase.from('fields').select('*').limit(50).order('created_at', { ascending: false });
      if (fetchError) {
        console.error('Failed to fetch fields:', fetchError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (data) setFields(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: 'ownership',
      label: STRINGS.FIELD_OWNERSHIP,
      options: [
        { value: 'OWNED', label: STRINGS.OWNED },
        { value: 'RENTED', label: STRINGS.RENTED },
      ],
    },
  ], []);

  // Filter logic
  const filteredFields = useMemo(() => {
    return fields.filter(field => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const name = field.name?.toLowerCase() || '';
        const location = field.location_text?.toLowerCase() || '';
        if (!name.includes(search) && !location.includes(search)) {
          return false;
        }
      }

      // Ownership filter
      if (filterValues.ownership && field.ownership !== filterValues.ownership) {
        return false;
      }

      return true;
    });
  }, [fields, searchValue, filterValues]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({ ownership: '' });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_FIELDS}</h1>
        <Link href="/app/fields/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>

      <SearchFilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredFields.map((field) => (
          <Link href={`/app/fields/${field.id}`} key={field.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <h3 className="font-bold text-lg mb-1">{field.name}</h3>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>{STRINGS.FIELD_AREA}: {field.area_ha} ჰა</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{field.ownership === 'OWNED' ? STRINGS.OWNED : STRINGS.RENTED}</span>
            </div>
            {field.location_text && <p className="text-xs text-gray-500 mt-2 truncate">{field.location_text}</p>}
          </Link>
        ))}
        {loading && (
          <div className="col-span-full text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && fields.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
        {!loading && fields.length > 0 && filteredFields.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            {STRINGS.NO_RESULTS}
          </div>
        )}
      </div>
    </div>
  );
}
