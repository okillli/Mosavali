'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic Options
  const [seasons, setSeasons] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    season_id: '',
    allocation_type: 'GENERAL', // GENERAL, FIELD, WORK, LOT, SEASON
    target_id: '',
    amount_gel: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('year', { ascending: false });
    if (s) {
        setSeasons(s);
        setFormData(p => ({ ...p, season_id: s.find((x:any) => x.is_current)?.id || s[0]?.id }));
    }

    const { data: f } = await supabase.from('fields').select('id, name');
    if (f) setFields(f);

    const { data: w } = await supabase.from('works').select('id, work_types(name), fields(name), planned_date').order('planned_date', { ascending: false }).limit(20);
    if (w) setWorks(w);

    const { data: l } = await supabase.from('lots').select('id, lot_code, crops(name_ka)').order('created_at', { ascending: false }).limit(20);
    if (l) setLots(l);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const { data: profile } = await supabase.from('profiles').select('farm_id').single();
    if (!profile) return;

    const targetId = formData.allocation_type === 'GENERAL' || formData.allocation_type === 'SEASON' ? null : formData.target_id;

    const { error: insertError } = await supabase.from('expenses').insert({
      farm_id: profile.farm_id,
      season_id: formData.season_id,
      allocation_type: formData.allocation_type,
      target_id: targetId,
      amount_gel: parseFloat(formData.amount_gel),
      expense_date: formData.expense_date,
      description: formData.description
    });

    if (insertError) {
      setError(STRINGS.INVALID_VALUE);
      setLoading(false);
    } else {
      router.push('/app/expenses');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_EXPENSES}</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

      <div className="bg-white p-6 rounded shadow space-y-4">
        
        {/* Season */}
        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.SEASON}</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.season_id}
            onChange={e => setFormData({...formData, season_id: e.target.value})}
          >
            {seasons.map(s => <option key={s.id} value={s.id}>{s.year}</option>)}
          </select>
        </div>

        {/* Allocation Type */}
        <div>
          <label className="block text-sm font-medium mb-1">ხარჯის ტიპი (განაწილება)</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.allocation_type}
            onChange={e => setFormData({...formData, allocation_type: e.target.value, target_id: ''})}
          >
            <option value="GENERAL">ზოგადი (ფერმის ხარჯი)</option>
            <option value="SEASON">სეზონური (მთლიანი სეზონი)</option>
            <option value="FIELD">{STRINGS.NAV_FIELDS} (კონკრეტულ მიწაზე)</option>
            <option value="WORK">{STRINGS.NAV_WORKS} (კონკრეტულ სამუშაოზე)</option>
            <option value="LOT">{STRINGS.NAV_LOTS} (კონკრეტულ მოსავალზე)</option>
          </select>
        </div>

        {/* Dynamic Target Select */}
        {formData.allocation_type === 'FIELD' && (
           <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.NAV_FIELDS}</label>
              <select className="w-full border rounded p-2" value={formData.target_id} onChange={e => setFormData({...formData, target_id: e.target.value})}>
                 <option value="">{STRINGS.SELECT_OPTION}</option>
                 {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
           </div>
        )}

        {formData.allocation_type === 'WORK' && (
           <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.NAV_WORKS}</label>
              <select className="w-full border rounded p-2" value={formData.target_id} onChange={e => setFormData({...formData, target_id: e.target.value})}>
                 <option value="">{STRINGS.SELECT_OPTION}</option>
                 {works.map(w => (
                    <option key={w.id} value={w.id}>
                        {w.work_types.name} @ {w.fields.name} ({w.planned_date})
                    </option>
                 ))}
              </select>
           </div>
        )}

        {formData.allocation_type === 'LOT' && (
           <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.NAV_LOTS}</label>
              <select className="w-full border rounded p-2" value={formData.target_id} onChange={e => setFormData({...formData, target_id: e.target.value})}>
                 <option value="">{STRINGS.SELECT_OPTION}</option>
                 {lots.map(l => (
                    <option key={l.id} value={l.id}>
                        {l.lot_code} ({l.crops.name_ka})
                    </option>
                 ))}
              </select>
           </div>
        )}

        <Input 
          label={`თანხა (${STRINGS.CURRENCY})`}
          type="number"
          step="0.01"
          value={formData.amount_gel}
          onChange={e => setFormData({...formData, amount_gel: e.target.value})}
        />

        <Input 
          label="თარიღი"
          type="date"
          value={formData.expense_date}
          onChange={e => setFormData({...formData, expense_date: e.target.value})}
        />

        <Input 
          label={STRINGS.NOTES}
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="მაგ: საწვავი, სასუქი..."
        />

        <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => router.back()}>{STRINGS.CANCEL}</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !formData.amount_gel}>
                {loading ? '...' : STRINGS.SAVE}
            </Button>
        </div>
      </div>
    </div>
  );
}