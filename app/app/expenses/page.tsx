'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import { PAGE_SIZE } from '../../../lib/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Tag, Loader2 } from 'lucide-react';
import { ExpenseWithRelations, Season } from '../../../types';
import { SearchFilterBar, FilterConfig, Button } from '../../../components/ui';

export default function ExpensesList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    allocation_type: '',
    season_id: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (seasonsError) {
        console.error('Failed to fetch seasons:', seasonsError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (seasonsData) setSeasons(seasonsData);

      // Fetch initial expenses
      await fetchExpenses(0, false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
      setLoading(false);
    }
  };

  const fetchExpenses = async (offset: number, append: boolean) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select('*, seasons(name)')
        .order('expense_date', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchError) {
        console.error('Failed to fetch expenses:', fetchError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (data) {
        if (append) {
          setExpenses(prev => [...prev, ...data]);
        } else {
          setExpenses(data);
        }
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchExpenses(expenses.length, true);
  }, [loadingMore, hasMore, expenses.length]);

  const getAllocationLabel = (type: string) => {
    return type === 'FIELD' ? STRINGS.NAV_FIELDS :
           type === 'WORK' ? STRINGS.NAV_WORKS :
           type === 'LOT' ? STRINGS.NAV_LOTS :
           type === 'SEASON' ? STRINGS.SEASON : STRINGS.ALLOCATION_GENERAL;
  };

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: 'allocation_type',
      label: STRINGS.ALLOCATION_TYPE,
      options: [
        { value: 'GENERAL', label: STRINGS.ALLOCATION_GENERAL },
        { value: 'SEASON', label: STRINGS.ALLOCATION_SEASONAL },
        { value: 'FIELD', label: STRINGS.ALLOCATION_FIELD },
        { value: 'WORK', label: STRINGS.ALLOCATION_WORK },
        { value: 'LOT', label: STRINGS.ALLOCATION_LOT },
      ],
    },
    {
      key: 'season_id',
      label: STRINGS.SEASON,
      options: seasons.map(s => ({ value: s.id, label: s.name })),
    },
  ], [seasons]);

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const description = expense.description?.toLowerCase() || '';
        if (!description.includes(search)) {
          return false;
        }
      }

      // Allocation type filter
      if (filterValues.allocation_type && expense.allocation_type !== filterValues.allocation_type) {
        return false;
      }

      // Season filter
      if (filterValues.season_id && expense.season_id !== filterValues.season_id) {
        return false;
      }

      return true;
    });
  }, [expenses, searchValue, filterValues]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({ allocation_type: '', season_id: '' });
  }, []);

  // Only show Load More when not filtering (filters work on loaded data)
  const showLoadMore = hasMore && !searchValue && !filterValues.allocation_type && !filterValues.season_id;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_EXPENSES}</h1>
        <Link href="/app/expenses/new" className="bg-red-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
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

      <div className="space-y-4">
        {filteredExpenses.map((expense) => (
          <div
            key={expense.id}
            onClick={() => router.push(`/app/expenses/${expense.id}`)}
            className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div>
              <h3 className="font-bold text-gray-800">{expense.description || STRINGS.NAV_EXPENSES}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Tag size={12} className="mr-1" />
                {getAllocationLabel(expense.allocation_type)}
                <span className="mx-2">|</span>
                {expense.expense_date}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-red-600">-{expense.amount_gel} {STRINGS.CURRENCY}</div>
              <div className="text-xs text-gray-400">{expense.seasons?.name} {STRINGS.SEASON}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && expenses.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
        {!loading && expenses.length > 0 && filteredExpenses.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_RESULTS}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && showLoadMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {STRINGS.LOADING}
              </>
            ) : (
              STRINGS.LOAD_MORE
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
