'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { STRINGS } from '../../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button, Select, TextArea } from '../../../../../components/ui';
import { Expense, Season, Field, WorkWithRelations, Lot } from '../../../../../types';

export default function EditExpensePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expense, setExpense] = useState<Expense | null>(null);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [works, setWorks] = useState<WorkWithRelations[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);

  const [formData, setFormData] = useState({
    season_id: '',
    allocation_type: 'GENERAL',
    target_id: '',
    amount_gel: '',
    expense_date: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Load expense
    const { data: expenseData } = await supabase.from('expenses').select('*').eq('id', id).single();
    if (expenseData) {
      setExpense(expenseData);
      setFormData({
        season_id: expenseData.season_id,
        allocation_type: expenseData.allocation_type,
        target_id: expenseData.target_id || '',
        amount_gel: expenseData.amount_gel.toString(),
        expense_date: expenseData.expense_date,
        description: expenseData.description || ''
      });
    }

    // Load master data
    const { data: s } = await supabase.from('seasons').select('*').order('year', { ascending: false });
    if (s) setSeasons(s);

    const { data: f } = await supabase.from('fields').select('id, name');
    if (f) setFields(f);

    const { data: w } = await supabase.from('works')
      .select('id, work_types(name), fields(name), planned_date')
      .order('planned_date', { ascending: false })
      .limit(20);
    if (w) setWorks(w);

    const { data: l } = await supabase.from('lots')
      .select('id, lot_code, crops(name_ka)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (l) setLots(l);

    setInitialLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const targetId = formData.allocation_type === 'GENERAL' || formData.allocation_type === 'SEASON'
      ? null
      : formData.target_id || null;

    const { error } = await supabase.from('expenses').update({
      season_id: formData.season_id,
      allocation_type: formData.allocation_type,
      target_id: targetId,
      amount_gel: parseFloat(formData.amount_gel),
      expense_date: formData.expense_date,
      description: formData.description || null
    }).eq('id', id);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
      setLoading(false);
    } else {
      router.push(`/app/expenses/${id}`);
    }
  };

  if (initialLoading) return <div className="p-4">{STRINGS.LOADING}</div>;
  if (!expense) return <div className="p-4">{STRINGS.EXPENSE_NOT_FOUND}</div>;

  const seasonOptions = seasons.map(s => ({ value: s.id, label: s.year.toString() }));
  const allocationOptions = [
    { value: 'GENERAL', label: STRINGS.ALLOCATION_GENERAL },
    { value: 'SEASON', label: STRINGS.ALLOCATION_SEASONAL },
    { value: 'FIELD', label: `${STRINGS.NAV_FIELDS} (${STRINGS.ALLOCATION_FIELD_SPECIFIC})` },
    { value: 'WORK', label: `${STRINGS.NAV_WORKS} (${STRINGS.ALLOCATION_WORK_SPECIFIC})` },
    { value: 'LOT', label: `${STRINGS.NAV_LOTS} (${STRINGS.ALLOCATION_LOT_SPECIFIC})` }
  ];
  const fieldOptions = fields.map(f => ({ value: f.id, label: f.name }));
  const workOptions = works.map(w => ({
    value: w.id,
    label: `${w.work_types?.name || ''} @ ${w.fields?.name || ''} (${w.planned_date})`
  }));
  const lotOptions = lots.map(l => ({
    value: l.id,
    label: `${l.lot_code} (${l.crops?.name_ka || ''})`
  }));

  const isValid = formData.amount_gel && formData.expense_date;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.EDIT} {STRINGS.NAV_EXPENSES}</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <Select
          label={STRINGS.SEASON}
          value={formData.season_id}
          onChange={e => setFormData({ ...formData, season_id: e.target.value })}
          options={seasonOptions}
        />

        <Select
          label={STRINGS.ALLOCATION_TYPE}
          value={formData.allocation_type}
          onChange={e => setFormData({ ...formData, allocation_type: e.target.value, target_id: '' })}
          options={allocationOptions}
        />

        {formData.allocation_type === 'FIELD' && (
          <Select
            label={STRINGS.NAV_FIELDS}
            value={formData.target_id}
            onChange={e => setFormData({ ...formData, target_id: e.target.value })}
            options={fieldOptions}
            placeholder={STRINGS.SELECT_OPTION}
          />
        )}

        {formData.allocation_type === 'WORK' && (
          <Select
            label={STRINGS.NAV_WORKS}
            value={formData.target_id}
            onChange={e => setFormData({ ...formData, target_id: e.target.value })}
            options={workOptions}
            placeholder={STRINGS.SELECT_OPTION}
          />
        )}

        {formData.allocation_type === 'LOT' && (
          <Select
            label={STRINGS.NAV_LOTS}
            value={formData.target_id}
            onChange={e => setFormData({ ...formData, target_id: e.target.value })}
            options={lotOptions}
            placeholder={STRINGS.SELECT_OPTION}
          />
        )}

        <Input
          label={`${STRINGS.AMOUNT} (${STRINGS.CURRENCY})`}
          type="number"
          step="0.01"
          value={formData.amount_gel}
          onChange={e => setFormData({ ...formData, amount_gel: e.target.value })}
        />

        <Input
          label={STRINGS.DATE}
          type="date"
          value={formData.expense_date}
          onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
        />

        <TextArea
          label={STRINGS.NOTES}
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder={STRINGS.EXPENSE_EXAMPLE}
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
