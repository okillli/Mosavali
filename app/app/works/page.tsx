'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { WorkWithRelations, Field, WorkType } from '../../../types';
import { SearchFilterBar, FilterConfig } from '../../../components/ui';

export default function WorksList() {
  const [works, setWorks] = useState<WorkWithRelations[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: '',
    field_id: '',
    work_type_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [worksRes, fieldsRes, workTypesRes] = await Promise.all([
        supabase.from('works')
          .select('*, fields(name), work_types(name)')
          .limit(50)
          .order('planned_date', { ascending: false }),
        supabase.from('fields')
          .select('id, name')
          .order('name'),
        supabase.from('work_types')
          .select('id, name')
          .order('name'),
      ]);

      if (worksRes.error) {
        console.error('Failed to fetch works:', worksRes.error);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (fieldsRes.error) {
        console.error('Failed to fetch fields:', fieldsRes.error);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (workTypesRes.error) {
        console.error('Failed to fetch work types:', workTypesRes.error);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (worksRes.data) setWorks(worksRes.data);
      if (fieldsRes.data) setFields(fieldsRes.data);
      if (workTypesRes.data) setWorkTypes(workTypesRes.data);
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
      key: 'status',
      label: STRINGS.STATUS,
      options: [
        { value: 'PLANNED', label: STRINGS.PLANNED },
        { value: 'COMPLETED', label: STRINGS.COMPLETED },
      ],
    },
    {
      key: 'work_type_id',
      label: STRINGS.WORK_TYPE,
      options: workTypes.map(wt => ({ value: wt.id, label: wt.name })),
    },
    {
      key: 'field_id',
      label: STRINGS.NAV_FIELDS,
      options: fields.map(f => ({ value: f.id, label: f.name })),
    },
  ], [fields, workTypes]);

  // Filter logic
  const filteredWorks = useMemo(() => {
    return works.filter(work => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const workTypeName = work.work_types?.name?.toLowerCase() || '';
        const fieldName = work.fields?.name?.toLowerCase() || '';
        if (!workTypeName.includes(search) && !fieldName.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (filterValues.status && work.status !== filterValues.status) {
        return false;
      }

      // Work type filter
      if (filterValues.work_type_id && work.work_type_id !== filterValues.work_type_id) {
        return false;
      }

      // Field filter
      if (filterValues.field_id && work.field_id !== filterValues.field_id) {
        return false;
      }

      return true;
    });
  }, [works, searchValue, filterValues]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({ status: '', field_id: '', work_type_id: '' });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_WORKS}</h1>
        <Link href="/app/works/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
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
        {filteredWorks.map((work) => (
          <Link href={`/app/works/${work.id}`} key={work.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">{work.work_types?.name || '-'}</h3>
              <p className="text-sm text-gray-600">{STRINGS.NAV_FIELDS}: {work.fields?.name || '-'}</p>
              <div className="flex items-center text-xs text-gray-400 mt-2">
                <Calendar size={12} className="mr-1" />
                {work.status === 'COMPLETED' ? work.completed_date : work.planned_date}
              </div>
            </div>
            <div className="text-right">
              {work.status === 'COMPLETED' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle2 size={12} className="mr-1" /> {STRINGS.COMPLETED}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  <Clock size={12} className="mr-1" /> {STRINGS.PLANNED}
                </span>
              )}
            </div>
          </Link>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && works.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
        {!loading && works.length > 0 && filteredWorks.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_RESULTS}
          </div>
        )}
      </div>
    </div>
  );
}
