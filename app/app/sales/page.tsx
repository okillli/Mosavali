'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import { PAGE_SIZE } from '../../../lib/hooks';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { Sale, Buyer } from '../../../types';
import { SearchFilterBar, FilterConfig, Button } from '../../../components/ui';

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    payment_status: '',
    buyer_id: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: buyersData, error: buyersError } = await supabase
        .from('buyers')
        .select('id, name')
        .order('name');

      if (buyersError) {
        console.error('Failed to fetch buyers:', buyersError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (buyersData) setBuyers(buyersData);

      // Fetch initial sales
      await fetchSales(0, false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
      setLoading(false);
    }
  };

  const fetchSales = async (offset: number, append: boolean) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sales')
        .select('*, buyers(name), lots(lot_code)')
        .order('sale_date', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchError) {
        console.error('Failed to fetch sales:', fetchError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (data) {
        if (append) {
          setSales(prev => [...prev, ...data]);
        } else {
          setSales(data);
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
    await fetchSales(sales.length, true);
  }, [loadingMore, hasMore, sales.length]);

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: 'payment_status',
      label: STRINGS.PAYMENT_STATUS,
      options: [
        { value: 'UNPAID', label: STRINGS.UNPAID },
        { value: 'PART_PAID', label: STRINGS.PART_PAID },
        { value: 'PAID', label: STRINGS.PAID },
      ],
    },
    {
      key: 'buyer_id',
      label: STRINGS.BUYER,
      options: buyers.map(b => ({ value: b.id, label: b.name })),
    },
  ], [buyers]);

  // Filter logic
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const buyerName = sale.buyers?.name?.toLowerCase() || '';
        const lotCode = sale.lots?.lot_code?.toLowerCase() || '';
        if (!buyerName.includes(search) && !lotCode.includes(search)) {
          return false;
        }
      }

      // Payment status filter
      if (filterValues.payment_status && sale.payment_status !== filterValues.payment_status) {
        return false;
      }

      // Buyer filter
      if (filterValues.buyer_id && sale.buyer_id !== filterValues.buyer_id) {
        return false;
      }

      return true;
    });
  }, [sales, searchValue, filterValues]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({ payment_status: '', buyer_id: '' });
  }, []);

  // Only show Load More when not filtering (filters work on loaded data)
  const showLoadMore = hasMore && !searchValue && !filterValues.payment_status && !filterValues.buyer_id;

  const getStatusColor = (status: string) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800';
    if (status === 'PART_PAID') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'PAID') return STRINGS.PAID;
    if (status === 'PART_PAID') return STRINGS.PART_PAID;
    return STRINGS.UNPAID;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_SALES}</h1>
        <Link href="/app/sales/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
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
        {filteredSales.map((sale) => (
          <Link href={`/app/sales/${sale.id}`} key={sale.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm text-gray-500 mb-1">{sale.sale_date}</div>
                <div className="font-bold text-lg">{sale.buyers?.name || '-'}</div>
                <div className="text-xs text-gray-500">{STRINGS.LOT_CODE}: {sale.lots?.lot_code || '-'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{sale.total_gel} {STRINGS.CURRENCY}</div>
                <div className="text-sm text-gray-600">{sale.weight_kg} {STRINGS.UNIT_KG}</div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(sale.payment_status)}`}>
                {getStatusLabel(sale.payment_status)}
              </span>
              <span className="text-xs text-blue-600">{STRINGS.VIEW} &rarr;</span>
            </div>
          </Link>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && sales.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
        {!loading && sales.length > 0 && filteredSales.length === 0 && (
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
