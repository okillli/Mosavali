'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import { PAGE_SIZE } from '../../../lib/hooks';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { Warehouse } from '../../../types';
import { SearchFilterBar, Button } from '../../../components/ui';

export default function WarehousesList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Search state (no dropdown filters needed for simple warehouse list)
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchWarehouses(0, false);
  }, []);

  const fetchWarehouses = async (offset: number, append: boolean) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('warehouses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchError) {
        console.error('Failed to fetch warehouses:', fetchError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (data) {
        if (append) {
          setWarehouses(prev => [...prev, ...data]);
        } else {
          setWarehouses(data);
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
    await fetchWarehouses(warehouses.length, true);
  }, [loadingMore, hasMore, warehouses.length]);

  // Filter logic - search only
  const filteredWarehouses = useMemo(() => {
    if (!searchValue) return warehouses;

    const search = searchValue.toLowerCase();
    return warehouses.filter(w => {
      const name = w.name?.toLowerCase() || '';
      const location = w.location_text?.toLowerCase() || '';
      return name.includes(search) || location.includes(search);
    });
  }, [warehouses, searchValue]);

  // Only show Load More when not filtering (filters work on loaded data)
  const showLoadMore = hasMore && !searchValue;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_WAREHOUSES}</h1>
        <Link href="/app/warehouses/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>

      <SearchFilterBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredWarehouses.map((w) => (
          <Link href={`/app/warehouses/${w.id}`} key={w.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <h3 className="font-bold text-lg mb-1">{w.name}</h3>
            {w.location_text ? (
              <p className="text-sm text-gray-500">{w.location_text}</p>
            ) : (
              <p className="text-sm text-gray-300 italic">{STRINGS.NO_ADDRESS}</p>
            )}
            <div className="mt-2 text-xs text-blue-600 font-medium">{STRINGS.VIEW_DETAILS} &rarr;</div>
          </Link>
        ))}
        {loading && (
          <div className="col-span-full text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && warehouses.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
        {!loading && warehouses.length > 0 && filteredWarehouses.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
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
