'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { STRINGS } from '../../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button, Select, TextArea } from '../../../../../components/ui';
import { Work, Field, WorkType, Season } from '../../../../../types';

export default function EditWorkPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [work, setWork] = useState<Work | null>(null);

  const [fields, setFields] = useState<Field[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [formData, setFormData] = useState({
    field_id: '',
    season_id: '',
    work_type_id: '',
    planned_date: '',
    status: 'PLANNED',
    completed_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Load work
    const { data: workData } = await supabase.from('works').select('*').eq('id', id).single();
    if (workData) {
      setWork(workData);
      setFormData({
        field_id: workData.field_id,
        season_id: workData.season_id,
        work_type_id: workData.work_type_id,
        planned_date: workData.planned_date,
        status: workData.status,
        completed_date: workData.completed_date || '',
        notes: workData.notes || ''
      });
    }

    // Load master data
    const { data: f } = await supabase.from('fields').select('*').order('name');
    const { data: wt } = await supabase.from('work_types').select('*').order('name');
    const { data: s } = await supabase.from('seasons').select('*').order('year', { ascending: false });

    if (f) setFields(f);
    if (wt) setWorkTypes(wt);
    if (s) setSeasons(s);

    setInitialLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const updateData: Record<string, unknown> = {
      field_id: formData.field_id,
      season_id: formData.season_id,
      work_type_id: formData.work_type_id,
      planned_date: formData.planned_date,
      status: formData.status,
      notes: formData.notes || null
    };

    if (formData.status === 'COMPLETED' && formData.completed_date) {
      updateData.completed_date = formData.completed_date;
    }

    const { error } = await supabase.from('works').update(updateData).eq('id', id);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
      setLoading(false);
    } else {
      router.push(`/app/works/${id}`);
    }
  };

  if (initialLoading) return <div className="p-4">{STRINGS.LOADING}</div>;
  if (!work) return <div className="p-4">{STRINGS.WORK_NOT_FOUND}</div>;

  const fieldOptions = fields.map(f => ({ value: f.id, label: f.name }));
  const workTypeOptions = workTypes.map(wt => ({ value: wt.id, label: wt.name }));
  const seasonOptions = seasons.map(s => ({ value: s.id, label: s.year.toString() }));
  const statusOptions = [
    { value: 'PLANNED', label: STRINGS.PLANNED },
    { value: 'COMPLETED', label: STRINGS.COMPLETED }
  ];

  const isValid = formData.field_id && formData.work_type_id;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.EDIT} {STRINGS.NAV_WORKS}</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <Select
          label={STRINGS.NAV_FIELDS}
          value={formData.field_id}
          onChange={e => setFormData({ ...formData, field_id: e.target.value })}
          options={fieldOptions}
          placeholder={STRINGS.SELECT_OPTION}
        />

        <Select
          label={STRINGS.WORK_TYPE}
          value={formData.work_type_id}
          onChange={e => setFormData({ ...formData, work_type_id: e.target.value })}
          options={workTypeOptions}
          placeholder={STRINGS.SELECT_OPTION}
        />

        <Select
          label={STRINGS.SEASON}
          value={formData.season_id}
          onChange={e => setFormData({ ...formData, season_id: e.target.value })}
          options={seasonOptions}
        />

        <Input
          label={STRINGS.PLANNED_DATE}
          type="date"
          value={formData.planned_date}
          onChange={e => setFormData({ ...formData, planned_date: e.target.value })}
        />

        <Select
          label={STRINGS.STATUS}
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value })}
          options={statusOptions}
        />

        {formData.status === 'COMPLETED' && (
          <Input
            label={STRINGS.COMPLETED_DATE}
            type="date"
            value={formData.completed_date}
            onChange={e => setFormData({ ...formData, completed_date: e.target.value })}
          />
        )}

        <TextArea
          label={STRINGS.NOTES}
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => router.back()}>
            {STRINGS.CANCEL}
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? '...' : STRINGS.SAVE}
          </Button>
        </div>
      </div>
    </div>
  );
}
