'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import { PAGE_SIZE } from '../../../lib/hooks';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { Lot, Crop, Field, Season } from '../../../types';
import { SearchFilterBar, FilterConfig, Button } from '../../../components/ui';

export default function LotsList() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    season_id: '',
    crop_id: '',
    field_id: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [cropsRes, fieldsRes, seasonsRes] = await Promise.all([
        supabase.from('crops')
          .select('id, name_ka')
          .order('name_ka'),
        supabase.from('fields')
          .select('id, name')
          .order('name'),
        supabase.from('seasons')
          .select('id, name, is_current')
          .order('created_at', { ascending: false }),
      ]);

      if (cropsRes.error) {
        console.error('Failed to fetch crops:', cropsRes.error);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (fieldsRes.error) {
        console.error('Failed to fetch fields:', fieldsRes.error);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (seasonsRes.error) {
        console.error('Failed to fetch seasons:', seasonsRes.error);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (cropsRes.data) setCrops(cropsRes.data);
      if (fieldsRes.data) setFields(fieldsRes.data);
      if (seasonsRes.data) {
        setSeasons(seasonsRes.data);
        // Auto-select current season as default filter
        const currentSeason = seasonsRes.data.find((s: Season) => s.is_current);
        if (currentSeason) {
          setFilterValues(prev => ({ ...prev, season_id: currentSeason.id }));
        }
      }

      // Fetch initial lots
      await fetchLots(0, false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
      setLoading(false);
    }
  };

  const fetchLots = async (offset: number, append: boolean) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('lots')
        .select('*, crops(name_ka), varieties(name), fields(name)')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchError) {
        console.error('Failed to fetch lots:', fetchError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (data) {
        if (append) {
          setLots(prev => [...prev, ...data]);
        } else {
          setLots(data);
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
    await fetchLots(lots.length, true);
  }, [loadingMore, hasMore, lots.length]);

  // Filter configuration
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: 'season_id',
      label: STRINGS.SEASON,
      options: seasons.map(s => ({ value: s.id, label: s.name })),
    },
    {
      key: 'crop_id',
      label: STRINGS.CROP,
      options: crops.map(c => ({ value: c.id, label: c.name_ka })),
    },
    {
      key: 'field_id',
      label: STRINGS.NAV_FIELDS,
      options: fields.map(f => ({ value: f.id, label: f.name })),
    },
  ], [seasons, crops, fields]);

  // Filter logic
  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const lotCode = lot.lot_code?.toLowerCase() || '';
        const cropName = lot.crops?.name_ka?.toLowerCase() || '';
        const varietyName = lot.varieties?.name?.toLowerCase() || '';
        if (!lotCode.includes(search) && !cropName.includes(search) && !varietyName.includes(search)) {
          return false;
        }
      }

      // Season filter
      if (filterValues.season_id && lot.season_id !== filterValues.season_id) {
        return false;
      }

      // Crop filter
      if (filterValues.crop_id && lot.crop_id !== filterValues.crop_id) {
        return false;
      }

      // Field filter
      if (filterValues.field_id && lot.field_id !== filterValues.field_id) {
        return false;
      }

      return true;
    });
  }, [lots, searchValue, filterValues]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({ season_id: '', crop_id: '', field_id: '' });
  }, []);

  // Only show Load More when not filtering (filters work on loaded data)
  const showLoadMore = hasMore && !searchValue && !filterValues.season_id && !filterValues.crop_id && !filterValues.field_id;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_LOTS}</h1>
        <Link href="/app/lots/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
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
        {filteredLots.map((lot) => (
          <Link href={`/app/lots/${lot.id}`} key={lot.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-green-800">{lot.lot_code}</h3>
                <p className="text-sm text-gray-700 font-medium">{lot.crops?.name_ka || '-'} - {lot.varieties?.name || '-'}</p>
                <p className="text-xs text-gray-500 mt-1">{STRINGS.NAV_FIELDS}: {lot.fields?.name || '-'}</p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-gray-800">{lot.harvested_kg} {STRINGS.UNIT_KG}</span>
                <span className="text-xs text-gray-500">{lot.harvest_date}</span>
              </div>
            </div>
          </Link>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && lots.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
        {!loading && lots.length > 0 && filteredLots.length === 0 && (
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
