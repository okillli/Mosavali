'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export default function NewWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fields, setFields] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    field_id: '',
    season_id: '',
    work_type_id: '',
    planned_date: new Date().toISOString().split('T')[0],
    status: 'PLANNED',
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      const { data: f } = await supabase.from('fields').select('*');
      const { data: wt } = await supabase.from('work_types').select('*');
      const { data: s } = await supabase.from('seasons').select('*').order('year', { ascending: false });
      
      if (f) setFields(f);
      if (wt) setWorkTypes(wt);
      if (s) {
        setSeasons(s);
        setFormData(p => ({ ...p, season_id: s.find((x:any) => x.is_current)?.id || s[0]?.id }));
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const { data: profile } = await supabase.from('profiles').select('farm_id').single();
    if (!profile) return;

    const { error: insertError } = await supabase.from('works').insert({
      farm_id: profile.farm_id,
      ...formData
    });

    if (insertError) {
      setError(STRINGS.INVALID_VALUE);
      setLoading(false);
    } else {
      router.push('/app/works');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_WORKS}</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.NAV_FIELDS}</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.field_id}
            onChange={e => setFormData({...formData, field_id: e.target.value})}
          >
            <option value="">{STRINGS.SELECT_OPTION}</option>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.WORK_TYPE}</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.work_type_id}
            onChange={e => setFormData({...formData, work_type_id: e.target.value})}
          >
            <option value="">{STRINGS.SELECT_OPTION}</option>
            {workTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
          </select>
        </div>

        <Input 
          label={STRINGS.PLANNED_DATE}
          type="date"
          value={formData.planned_date}
          onChange={e => setFormData({...formData, planned_date: e.target.value})}
        />

        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.STATUS}</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="PLANNED">{STRINGS.PLANNED}</option>
            <option value="COMPLETED">{STRINGS.COMPLETED}</option>
          </select>
        </div>

        <Input 
          label={STRINGS.NOTES}
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
        />

        <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => router.back()}>{STRINGS.CANCEL}</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !formData.field_id || !formData.work_type_id}>
                {loading ? '...' : STRINGS.SAVE}
            </Button>
        </div>
      </div>
    </div>
  );
}