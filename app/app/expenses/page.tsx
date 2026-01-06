'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Tag } from 'lucide-react';
import { ExpenseWithRelations } from '../../../types';

export default function ExpensesList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const { data } = await supabase.from('expenses')
      .select('*, seasons(year)')
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  };

  const getAllocationLabel = (type: string) => {
    return type === 'FIELD' ? STRINGS.NAV_FIELDS : 
           type === 'WORK' ? STRINGS.NAV_WORKS : 
           type === 'LOT' ? STRINGS.NAV_LOTS :
           type === 'SEASON' ? STRINGS.SEASON : STRINGS.ALLOCATION_GENERAL;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_EXPENSES}</h1>
        <Link href="/app/expenses/new" className="bg-red-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>
      
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            onClick={() => router.push(`/app/expenses/${expense.id}`)}
            className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div>
               <h3 className="font-bold text-gray-800">{expense.description || STRINGS.NAV_EXPENSES}</h3>
               <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Tag size={12} className="mr-1" />
                  {getAllocationLabel(expense.allocation_type)}
                  <span className="mx-2">|</span>
                  {expense.expense_date}
               </div>
            </div>
            <div className="text-right">
               <div className="font-bold text-lg text-red-600">-{expense.amount_gel} {STRINGS.CURRENCY}</div>
               <div className="text-xs text-gray-400">{expense.seasons?.year} {STRINGS.SEASON}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && expenses.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
      </div>
    </div>
  );
}
