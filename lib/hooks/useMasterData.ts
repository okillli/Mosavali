import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Season, Crop, Field, Warehouse, WorkType } from '../../types';

interface MasterData {
  seasons: Season[];
  crops: Crop[];
  fields: Field[];
  warehouses: Warehouse[];
  workTypes: WorkType[];
  loading: boolean;
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

  const fetchData = useCallback(async () => {
    setLoading(true);

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

    // Cache the data
    setCachedData({
      seasons: newSeasons,
      crops: newCrops,
      fields: newFields,
      warehouses: newWarehouses,
      workTypes: newWorkTypes,
    });

    setLoading(false);
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
    refresh,
  };
}
