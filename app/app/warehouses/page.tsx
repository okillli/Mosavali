'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Warehouse } from '../../../types';

export default function WarehousesList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    const { data } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false });
    if (data) setWarehouses(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_WAREHOUSES}</h1>
        <Link href="/app/warehouses/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {warehouses.map((w) => (
          <Link href={`/app/warehouses/${w.id}`} key={w.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <h3 className="font-bold text-lg mb-1">{w.name}</h3>
            {w.location_text ? (
                <p className="text-sm text-gray-500">{w.location_text}</p>
            ) : (
                <p className="text-sm text-gray-300 italic">მისამართი გარეშე</p>
            )}
            <div className="mt-2 text-xs text-blue-600 font-medium">დეტალების ნახვა &rarr;</div>
          </Link>
        ))}
        {loading && (
          <div className="col-span-full text-center py-10 text-gray-500">იტვირთება...</div>
        )}
        {!loading && warehouses.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            მონაცემები არ მოიძებნა
          </div>
        )}
      </div>
    </div>
  );
}