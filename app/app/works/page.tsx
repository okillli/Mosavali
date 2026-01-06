'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { WorkWithRelations } from '../../../types';

export default function WorksList() {
  const [works, setWorks] = useState<WorkWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    const { data } = await supabase.from('works')
      .select('*, fields(name), work_types(name)')
      .limit(50)
      .order('planned_date', { ascending: false });
    if (data) setWorks(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_WORKS}</h1>
        <Link href="/app/works/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>
      
      <div className="space-y-4">
        {works.map((work) => (
          <Link href={`/app/works/${work.id}`} key={work.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors flex justify-between items-center">
            <div>
               <h3 className="font-bold text-gray-800">{work.work_types?.name || '-'}</h3>
               <p className="text-sm text-gray-600">{STRINGS.NAV_FIELDS}: {work.fields?.name || '-'}</p>
               <div className="flex items-center text-xs text-gray-400 mt-2">
                  <Calendar size={12} className="mr-1" />
                  {work.status === 'COMPLETED' ? work.completed_date : work.planned_date}
               </div>
            </div>
            <div className="text-right">
               {work.status === 'COMPLETED' ? (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle2 size={12} className="mr-1" /> {STRINGS.COMPLETED}
                 </span>
               ) : (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Clock size={12} className="mr-1" /> {STRINGS.PLANNED}
                 </span>
               )}
            </div>
          </Link>
        ))}
        {loading && (
          <div className="text-center py-10 text-gray-500">{STRINGS.LOADING}</div>
        )}
        {!loading && works.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {STRINGS.NO_DATA}
          </div>
        )}
      </div>
    </div>
  );
}