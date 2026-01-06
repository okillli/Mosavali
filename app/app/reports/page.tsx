'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import { StockViewWithRelations } from '../../../types';

interface YieldDataItem {
  id: string;
  name: string;
  area: number;
  total_kg: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stock, setStock] = useState<StockViewWithRelations[]>([]);
  const [financials, setFinancials] = useState({ income: 0, expense: 0, profit: 0 });
  const [yieldData, setYieldData] = useState<YieldDataItem[]>([]);
  const [tab, setTab] = useState<'STOCK' | 'FINANCE' | 'YIELD'>('STOCK');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Stock
      const { data: s, error: stockError } = await supabase.from('v_bin_lot_stock')
        .select('*, lots(lot_code, crop_id, crops(name_ka), variety_id, varieties(name)), bins(name, warehouse_id, warehouses(name))');

      if (stockError) {
        console.error('Failed to fetch stock:', stockError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (s) setStock(s);

      // 2. Financials (Income from Sales, Expense from Expenses)
      const { data: sales, error: salesError } = await supabase.from('sales').select('total_gel');
      const { data: expenses, error: expensesError } = await supabase.from('expenses').select('amount_gel');

      if (salesError) {
        console.error('Failed to fetch sales:', salesError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }
      if (expensesError) {
        console.error('Failed to fetch expenses:', expensesError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      const income = sales?.reduce((sum, item) => sum + item.total_gel, 0) || 0;
      const expense = expenses?.reduce((sum, item) => sum + item.amount_gel, 0) || 0;
      setFinancials({ income, expense, profit: income - expense });

      // 3. Yield (Lots grouped by field)
      // We fetch lots and join fields
      const { data: l, error: lotsError } = await supabase.from('lots')
          .select('harvested_kg, field_id, fields(name, area_ha)');

      if (lotsError) {
        console.error('Failed to fetch lots:', lotsError);
        setError(STRINGS.LOAD_ERROR);
        return;
      }

      if (l) {
          const grouped: Record<string, YieldDataItem> = {};
          l.forEach((lot) => {
              const fid = lot.field_id;
              if(!grouped[fid]) {
                  grouped[fid] = {
                      id: fid,
                      name: lot.fields?.name || '-',
                      area: lot.fields?.area_ha || 1,
                      total_kg: 0
                  };
              }
              grouped[fid].total_kg += lot.harvested_kg;
          });
          setYieldData(Object.values(grouped));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const totalKg = useMemo(() => stock.reduce((sum, item) => sum + item.stock_kg, 0), [stock]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{STRINGS.NAV_REPORTS}</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
          <button 
            className={`px-4 py-2 font-medium ${tab === 'STOCK' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
            onClick={() => setTab('STOCK')}
          >
            {STRINGS.REPORT_STOCK}
          </button>
          <button 
            className={`px-4 py-2 font-medium ${tab === 'FINANCE' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
            onClick={() => setTab('FINANCE')}
          >
            {STRINGS.REPORT_PNL}
          </button>
          <button 
            className={`px-4 py-2 font-medium ${tab === 'YIELD' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
            onClick={() => setTab('YIELD')}
          >
            {STRINGS.REPORT_YIELD}
          </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {loading && <div>{STRINGS.LOADING}</div>}

      {!loading && tab === 'STOCK' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                <h3 className="text-gray-500 text-sm font-bold uppercase">{STRINGS.REPORT_STOCK}</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalKg.toLocaleString()} {STRINGS.UNIT_KG}</p>
                <p className="text-sm text-gray-500">{(totalKg / 1000).toFixed(2)} {STRINGS.UNIT_TON}</p>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700">{STRINGS.DETAILED_LIST}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b text-gray-500">
                            <tr>
                                <th className="px-6 py-3">{STRINGS.NAV_WAREHOUSES}</th>
                                <th className="px-6 py-3">{STRINGS.LOT_CODE}</th>
                                <th className="px-6 py-3">{STRINGS.CROP}</th>
                                <th className="px-6 py-3 text-right">{STRINGS.STOCK}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {stock.map((item) => (
                                <tr key={`${item.bin_id}-${item.lot_id}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium">{item.bins?.warehouses?.name || '-'} - {item.bins?.name || '-'}</td>
                                    <td className="px-6 py-3">{item.lots?.lot_code || '-'}</td>
                                    <td className="px-6 py-3">{item.lots?.crops?.name_ka || '-'} / {item.lots?.varieties?.name || '-'}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold">
                                        {item.stock_kg} <span className="text-xs font-normal">{STRINGS.UNIT_KG}</span>
                                    </td>
                                </tr>
                            ))}
                            {stock.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">{STRINGS.BIN_EMPTY}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {!loading && tab === 'FINANCE' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">შემოსავალი</h3>
                    <p className="text-2xl font-bold text-green-700 mt-2">+{financials.income.toLocaleString()} ₾</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">ხარჯი</h3>
                    <p className="text-2xl font-bold text-red-700 mt-2">-{financials.expense.toLocaleString()} ₾</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">მოგება</h3>
                    <p className={`text-2xl font-bold mt-2 ${financials.profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {financials.profit.toLocaleString()} ₾
                    </p>
                </div>
             </div>
             <p className="text-xs text-gray-400 text-center">მონაცემები მოიცავს ყველა სეზონს.</p>
          </div>
      )}

      {!loading && tab === 'YIELD' && (
          <div className="space-y-4">
              {yieldData.map((field) => {
                  const yieldPerHa = field.total_kg / field.area;
                  return (
                      <div key={field.id} className="bg-white p-4 rounded shadow border flex justify-between items-center">
                          <div>
                              <div className="font-bold text-lg">{field.name}</div>
                              <div className="text-sm text-gray-500">{field.area} ჰა</div>
                          </div>
                          <div className="text-right">
                              <div className="font-bold text-xl text-green-700">{(yieldPerHa / 1000).toFixed(2)} ტ/ჰა</div>
                              <div className="text-xs text-gray-400">სულ: {field.total_kg} კგ</div>
                          </div>
                      </div>
                  );
              })}
              {yieldData.length === 0 && <div className="text-center text-gray-500 py-10">მონაცემები არ არის</div>}
          </div>
      )}
    </div>
  );
}