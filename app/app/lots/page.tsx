'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Lot } from '../../../types';

export default function LotsList() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    const { data } = await supabase.from('lots')
      .select('*, crops(name_ka), varieties(name), fields(name)')
      .order('created_at', { ascending: false });
    if (data) setLots(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_LOTS}</h1>
        <Link href="/app/lots/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>
      
      <div className="space-y-4">
        {lots.map((lot) => (
          <Link href={`/app/lots/${lot.id}`} key={lot.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-lg text-green-800">{lot.lot_code}</h3>
                 <p className="text-sm text-gray-700 font-medium">{lot.crops?.name_ka || '-'} - {lot.varieties?.name || '-'}</p>
                 <p className="text-xs text-gray-500 mt-1">{STRINGS.NAV_FIELDS}: {lot.fields?.name || '-'}</p>
               </div>
               <div className="text-right">
                  <span className="block font-bold text-gray-800">{lot.harvested_kg} {STRINGS.UNIT_KG}</span>
                  <span className="text-xs text-gray-500">{lot.harvest_date}</span>
               </div>
            </div>
          </Link>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && lots.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
      </div>
    </div>
  );
}
