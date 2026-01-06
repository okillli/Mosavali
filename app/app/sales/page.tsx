'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Sale } from '../../../types';

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data } = await supabase.from('sales')
      .select('*, buyers(name), lots(lot_code)')
      .order('sale_date', { ascending: false });
    if (data) setSales(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
      if (status === 'PAID') return 'bg-green-100 text-green-800';
      if (status === 'PART_PAID') return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (status: string) => {
      if (status === 'PAID') return STRINGS.PAID;
      if (status === 'PART_PAID') return STRINGS.PART_PAID;
      return STRINGS.UNPAID;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_SALES}</h1>
        <Link href="/app/sales/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>
      
      <div className="space-y-4">
        {sales.map((sale) => (
          <Link href={`/app/sales/${sale.id}`} key={sale.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="text-sm text-gray-500 mb-1">{sale.sale_date}</div>
                    <div className="font-bold text-lg">{sale.buyers?.name || '-'}</div>
                    <div className="text-xs text-gray-500">{STRINGS.LOT_CODE}: {sale.lots?.lot_code || '-'}</div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-lg">{sale.total_gel} {STRINGS.CURRENCY}</div>
                    <div className="text-sm text-gray-600">{sale.weight_kg} {STRINGS.UNIT_KG}</div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
                 <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(sale.payment_status)}`}>
                     {getStatusLabel(sale.payment_status)}
                 </span>
                 <span className="text-xs text-blue-600">ნახვა &rarr;</span>
            </div>
          </Link>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">იტვირთება...</div>
        )}
        {!loading && sales.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            მონაცემები არ მოიძებნა
          </div>
        )}
      </div>
    </div>
  );
}