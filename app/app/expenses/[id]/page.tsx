'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button, ConfirmDialog } from '../../../../components/ui';
import { Tag, Calendar, Trash2, Pencil } from 'lucide-react';
import { ExpenseWithRelations } from '../../../../types';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseWithRelations | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    setError(null);
    const { data, error: fetchError } = await supabase.from('expenses')
      .select('*, seasons(year)')
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      console.error('Failed to fetch expense:', fetchError);
      setError(STRINGS.EXPENSE_NOT_FOUND);
      return;
    }

    setExpense(data);
    // Fetch target name if allocated to specific entity
    if (data.target_id) {
      await fetchTargetName(data.allocation_type, data.target_id);
    }
  };

  const fetchTargetName = async (allocationType: string, targetId: string) => {
    const tableConfig: Record<string, { table: string; select: string; transform: (data: Record<string, unknown>) => string | null }> = {
      FIELD: {
        table: 'fields',
        select: 'name',
        transform: (data) => data?.name as string | null
      },
      WORK: {
        table: 'works',
        select: 'work_types(name), fields(name)',
        transform: (data) => data ? `${(data.work_types as { name?: string })?.name || '-'} @ ${(data.fields as { name?: string })?.name || '-'}` : null
      },
      LOT: {
        table: 'lots',
        select: 'lot_code',
        transform: (data) => data?.lot_code as string | null
      }
    };

    const config = tableConfig[allocationType];
    if (!config) {
      setTargetName(null);
      return;
    }

    const { data } = await supabase
      .from(config.table)
      .select(config.select)
      .eq('id', targetId)
      .single();

    setTargetName(data ? config.transform(data) : null);
  };

  const getAllocationLabel = (type: string) => {
    return type === 'FIELD' ? STRINGS.NAV_FIELDS :
           type === 'WORK' ? STRINGS.NAV_WORKS :
           type === 'LOT' ? STRINGS.NAV_LOTS :
           type === 'SEASON' ? STRINGS.SEASON : STRINGS.ALLOCATION_GENERAL;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);

    if (deleteError) {
      console.error('Failed to delete expense:', deleteError);
      setError(STRINGS.DELETE_ERROR);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    } else {
      router.back();
    }
  };

  if (error && !expense) return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => router.push('/app/expenses')} className="mb-4">&larr; {STRINGS.BACK}</Button>
      <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
    </div>
  );

  if (!expense) return <div className="p-4">{STRINGS.LOADING}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <Button variant="secondary" onClick={() => router.back()} className="mb-4">&larr; {STRINGS.BACK}</Button>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {expense.description || STRINGS.NAV_EXPENSES}
            </h1>
            <div className="flex items-center text-gray-600 mt-2">
              <Tag size={16} className="mr-2" />
              <span>{getAllocationLabel(expense.allocation_type)}</span>
              {targetName && (
                <span className="ml-2 text-gray-500">• {targetName}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/app/expenses/${id}/edit`)}
              className="flex items-center gap-1"
            >
              <Pencil size={16} />
              {STRINGS.EDIT}
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-1"
            >
              <Trash2 size={16} />
              {STRINGS.DELETE}
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">{STRINGS.EXPENSE_AMOUNT}</label>
              <div className="text-2xl font-bold text-red-600">-{Number(expense.amount_gel).toLocaleString()} {STRINGS.CURRENCY}</div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <Calendar size={12} /> {STRINGS.EXPENSE_DATE}
              </label>
              <div className="text-lg">{expense.expense_date}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">{STRINGS.SEASON}</label>
              <div className="text-lg">{expense.seasons?.name || '-'}</div>
            </div>
          </div>

          {expense.description && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">{STRINGS.NOTES}</label>
              <p className="text-gray-700 mt-1">{expense.description}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={`${STRINGS.DELETE_EXPENSE_CONFIRM}? ${STRINGS.DELETE_CANNOT_UNDO}`}
        confirmLabel={STRINGS.DELETE}
        cancelLabel={STRINGS.CANCEL}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
