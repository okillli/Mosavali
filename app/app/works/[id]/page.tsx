'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, ConfirmDialog } from '../../../../components/ui';
import { CheckCircle2, Clock, Tractor, Plus, ChevronUp, Calendar, Pencil, Trash2 } from 'lucide-react';
import { WorkWithRelations, Expense } from '../../../../types';

export default function WorkDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [work, setWork] = useState<WorkWithRelations | null>(null);

  // Completion form state
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionNotes, setCompletionNotes] = useState('');

  // Linked expenses state
  const [linkedExpenses, setLinkedExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    amount_gel: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (id) fetchWork();
  }, [id]);

  const fetchWork = async () => {
    setError(null);
    const { data, error: fetchError } = await supabase.from('works')
        .select('*, fields(name), work_types(name), seasons(year)')
        .eq('id', id)
        .single();

    if (fetchError || !data) {
        console.error('Failed to fetch work:', fetchError);
        setError(STRINGS.WORK_NOT_FOUND);
        return;
    }

    setWork(data);
    if(data.notes) setCompletionNotes(data.notes);

    // Fetch linked expenses
    const { data: expenses } = await supabase.from('expenses')
        .select('*')
        .eq('allocation_type', 'WORK')
        .eq('target_id', id)
        .order('expense_date', { ascending: false });
    if (expenses) setLinkedExpenses(expenses);
  };

  const markCompleted = async () => {
      setCompleting(true);
      setError(null);

      try {
        const { error: updateError } = await supabase.from('works').update({
            status: 'COMPLETED',
            completed_date: completedDate,
            notes: completionNotes
        }).eq('id', id);

        if (updateError) {
          console.error('Failed to mark completed:', updateError);
          setError(STRINGS.SAVE_ERROR);
          return;
        }
        fetchWork();
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(STRINGS.SAVE_ERROR);
      } finally {
        setCompleting(false);
      }
  };

  const createExpense = async () => {
    if (!work || !expenseForm.amount_gel) return;

    setExpenseSaving(true);
    setError(null);
    const { data: profile } = await supabase
        .from('profiles')
        .select('farm_id')
        .single();

    if (!profile) {
      console.error('Failed to fetch profile');
      setError(STRINGS.SAVE_ERROR);
      setExpenseSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from('expenses').insert({
      farm_id: profile.farm_id,
      season_id: work.season_id,
      allocation_type: 'WORK',
      target_id: work.id,
      amount_gel: parseFloat(expenseForm.amount_gel),
      expense_date: expenseForm.expense_date,
      description: expenseForm.description || null
    });

    if (insertError) {
      console.error('Failed to create expense:', insertError);
      setError(STRINGS.SAVE_ERROR);
    } else {
      setShowExpenseForm(false);
      setExpenseForm({
        amount_gel: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
      });
      fetchWork();
    }
    setExpenseSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    // First delete linked expenses
    await supabase.from('expenses').delete().eq('allocation_type', 'WORK').eq('target_id', id);

    // Then delete the work
    const { error: deleteError } = await supabase.from('works').delete().eq('id', id);

    if (deleteError) {
      console.error('Failed to delete work:', deleteError);
      setError(STRINGS.DELETE_ERROR);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    } else {
      router.push('/app/works');
    }
  };

  const getDeleteWarning = (): string => {
    if (linkedExpenses.length > 0) {
      return `ამ სამუშაოს აქვს ${linkedExpenses.length} დაკავშირებული ხარჯი. ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  const totalExpenses = useMemo(() => linkedExpenses.reduce((sum, e) => sum + Number(e.amount_gel), 0), [linkedExpenses]);

  if (error && !work) return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => router.push('/app/works')} className="mb-4">&larr; {STRINGS.BACK}</Button>
      <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
    </div>
  );

  if(!work) return <div className="p-4">{STRINGS.LOADING}</div>;

  return (
    <div className="max-w-2xl mx-auto">
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <Button variant="secondary" onClick={() => router.back()} className="mb-4">&larr; {STRINGS.BACK}</Button>

        <div className="bg-white rounded shadow overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Tractor className="text-green-700" />
                        {work.work_types?.name || '-'}
                    </h1>
                    <p className="text-gray-600 mt-1">{STRINGS.NAV_FIELDS}: {work.fields?.name || '-'}</p>
                </div>
                <div className="flex items-center gap-3">
                    {work.status === 'COMPLETED' ? (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                            <CheckCircle2 size={16} className="mr-1" /> {STRINGS.COMPLETED}
                         </span>
                    ) : (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">
                            <Clock size={16} className="mr-1" /> {STRINGS.PLANNED}
                         </span>
                    )}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/app/works/${id}/edit`)}
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
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{STRINGS.PLANNED_DATE}</label>
                        <div className="text-lg">{work.planned_date}</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{STRINGS.SEASON}</label>
                        <div className="text-lg">{work.seasons?.name || '-'}</div>
                    </div>
                </div>

                {work.status === 'PLANNED' && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-3">სამუშაოს დასრულება</h3>
                        <Input 
                            label={STRINGS.COMPLETED_DATE}
                            type="date"
                            value={completedDate}
                            onChange={e => setCompletedDate(e.target.value)}
                        />
                        <Input 
                            label={STRINGS.NOTES}
                            value={completionNotes}
                            onChange={e => setCompletionNotes(e.target.value)}
                        />
                        <Button onClick={markCompleted} disabled={completing} className="w-full mt-2">
                            {completing ? '...' : STRINGS.MARK_AS_COMPLETED}
                        </Button>
                    </div>
                )}

                {work.status === 'COMPLETED' && (
                    <div className="bg-green-50 p-4 rounded border border-green-100">
                         <div className="flex justify-between items-center mb-2">
                             <span className="font-bold text-green-800">{STRINGS.COMPLETED_DATE}</span>
                             <span className="font-mono">{work.completed_date}</span>
                         </div>
                         {work.notes && (
                             <div>
                                 <span className="text-xs font-bold text-green-700 uppercase">{STRINGS.NOTES}</span>
                                 <p className="text-green-900">{work.notes}</p>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>

        {/* Linked Expenses Section */}
        <div className="bg-white rounded shadow overflow-hidden mt-4">
            <div className="p-4 border-b bg-gray-50">
                <h2 className="font-bold text-gray-800">{STRINGS.LINKED_EXPENSES}</h2>
            </div>
            <div className="p-4 space-y-3">
                {linkedExpenses.length === 0 && !showExpenseForm && (
                    <p className="text-gray-500 text-center py-2">{STRINGS.NO_LINKED_EXPENSES}</p>
                )}

                {linkedExpenses.map(expense => (
                    <div
                        key={expense.id}
                        onClick={() => router.push(`/app/expenses/${expense.id}`)}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <div>
                            <div className="font-medium">{expense.description || STRINGS.NAV_EXPENSES}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Calendar size={12} className="mr-1" /> {expense.expense_date}
                            </div>
                        </div>
                        <div className="text-red-600 font-bold">-{Number(expense.amount_gel).toLocaleString()} {STRINGS.CURRENCY}</div>
                    </div>
                ))}

                {linkedExpenses.length > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-bold text-gray-700">{STRINGS.TOTAL_EXPENSES}</span>
                        <span className="font-bold text-red-600">-{totalExpenses.toLocaleString()} {STRINGS.CURRENCY}</span>
                    </div>
                )}

                {/* Add Expense Button / Form */}
                {!showExpenseForm ? (
                    <button
                        onClick={() => setShowExpenseForm(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 text-green-700 border-2 border-dashed border-green-300 rounded hover:bg-green-50 transition-colors mt-2"
                    >
                        <Plus size={18} />
                        {STRINGS.ADD_EXPENSE_TO_WORK}
                    </button>
                ) : (
                    <div className="border-2 border-green-200 rounded p-4 bg-green-50 mt-2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-green-800">{STRINGS.ADD_EXPENSE_TO_WORK}</h3>
                            <button onClick={() => setShowExpenseForm(false)} className="text-gray-500 hover:text-gray-700">
                                <ChevronUp size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <Input
                                label={`${STRINGS.EXPENSE_AMOUNT} (${STRINGS.CURRENCY})`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={expenseForm.amount_gel}
                                onChange={e => setExpenseForm({...expenseForm, amount_gel: e.target.value})}
                                placeholder="0.00"
                            />
                            <Input
                                label={STRINGS.EXPENSE_DATE}
                                type="date"
                                value={expenseForm.expense_date}
                                onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                            />
                            <Input
                                label={STRINGS.NOTES}
                                value={expenseForm.description}
                                onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                                placeholder="მაგ: საწვავი, სასუქი..."
                            />
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowExpenseForm(false)}
                                >
                                    {STRINGS.CANCEL}
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={createExpense}
                                    disabled={expenseSaving || !expenseForm.amount_gel}
                                >
                                    {expenseSaving ? '...' : STRINGS.SAVE}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
            isOpen={showDeleteDialog}
            title={STRINGS.DELETE_CONFIRM_TITLE}
            message={`${STRINGS.DELETE_WORK_CONFIRM} "${work.work_types?.name || ''}"? ${getDeleteWarning()}`}
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