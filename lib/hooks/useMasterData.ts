import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { STRINGS } from '../strings';
import type { Season, Crop, Field, Warehouse, WorkType } from '../../types';

interface MasterData {
  seasons: Season[];
  crops: Crop[];
  fields: Field[];
  warehouses: Warehouse[];
  workTypes: WorkType[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CACHE_KEY = 'mosavali_master_data';

interface CachedData {
  seasons: Season[];
  crops: Crop[];
  fields: Field[];
  warehouses: Warehouse[];
  workTypes: WorkType[];
}

function getCachedData(): CachedData | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // sessionStorage not available or parse error
  }
  return null;
}

function setCachedData(data: CachedData): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage not available or quota exceeded
  }
}

function clearCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // sessionStorage not available
  }
}

export function useMasterData(): MasterData {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Check cache first
    const cached = getCachedData();
    if (cached) {
      setSeasons(cached.seasons);
      setCrops(cached.crops);
      setFields(cached.fields);
      setWarehouses(cached.warehouses);
      setWorkTypes(cached.workTypes);
      setLoading(false);
      return;
    }

    try {
      // Fetch all master data in parallel
      const [
        seasonsResult,
        cropsResult,
        fieldsResult,
        warehousesResult,
        workTypesResult,
      ] = await Promise.all([
        supabase.from('seasons').select('*').order('created_at', { ascending: false }),
        supabase.from('crops').select('*').order('name_ka'),
        supabase.from('fields').select('*').order('name'),
        supabase.from('warehouses').select('*').order('name'),
        supabase.from('work_types').select('*').order('name'),
      ]);

      // Check for any errors
      if (seasonsResult.error || cropsResult.error || fieldsResult.error ||
          warehousesResult.error || workTypesResult.error) {
        console.error('Master data fetch errors:', {
          seasons: seasonsResult.error,
          crops: cropsResult.error,
          fields: fieldsResult.error,
          warehouses: warehousesResult.error,
          workTypes: workTypesResult.error
        });
        setError(STRINGS.LOAD_ERROR);
        // Still set whatever data succeeded
      }

      const newSeasons = seasonsResult.data || [];
      const newCrops = cropsResult.data || [];
      const newFields = fieldsResult.data || [];
      const newWarehouses = warehousesResult.data || [];
      const newWorkTypes = workTypesResult.data || [];

      setSeasons(newSeasons);
      setCrops(newCrops);
      setFields(newFields);
      setWarehouses(newWarehouses);
      setWorkTypes(newWorkTypes);

      // Only cache if no errors occurred
      if (!seasonsResult.error && !cropsResult.error && !fieldsResult.error &&
          !warehousesResult.error && !workTypesResult.error) {
        setCachedData({
          seasons: newSeasons,
          crops: newCrops,
          fields: newFields,
          warehouses: newWarehouses,
          workTypes: newWorkTypes,
        });
      }
    } catch (err) {
      console.error('Master data fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    clearCache();
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    seasons,
    crops,
    fields,
    warehouses,
    workTypes,
    loading,
    error,
    refresh,
  };
}
