'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { STRINGS } from '../../lib/strings';
import { PlusCircle, ArrowRightLeft, DollarSign, Clock, Leaf } from 'lucide-react';
import { WorkWithRelations, Lot } from '../../types';

export default function Dashboard() {
  const [pendingWorks, setPendingWorks] = useState<WorkWithRelations[]>([]);
  const [recentLots, setRecentLots] = useState<Lot[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // 1. Pending Works (Planned, Date Ascending)
    const { data: works } = await supabase.from('works')
      .select('*, work_types(name), fields(name)')
      .eq('status', 'PLANNED')
      .order('planned_date', { ascending: true })
      .limit(5);
    if(works) setPendingWorks(works);

    // 2. Recent Harvests (Latest 5)
    const { data: lots } = await supabase.from('lots')
      .select('*, crops(name_ka), varieties(name)')
      .order('harvest_date', { ascending: false })
      .limit(5);
    if(lots) setRecentLots(lots);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">{STRINGS.NAV_DASHBOARD}</h1>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/app/lots/new" className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition">
           <PlusCircle className="text-green-600 mb-2" size={24} />
           <span className="font-medium text-xs md:text-sm text-gray-700">{STRINGS.ADD} {STRINGS.NAV_LOTS}</span>
        </Link>
        <Link href="/app/sales/new" className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition">
           <DollarSign className="text-blue-600 mb-2" size={24} />
           <span className="font-medium text-xs md:text-sm text-gray-700">{STRINGS.ADD} {STRINGS.NAV_SALES}</span>
        </Link>
        <Link href="/app/transfer" className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition">
           <ArrowRightLeft className="text-orange-500 mb-2" size={24} />
           <span className="font-medium text-xs md:text-sm text-gray-700">{STRINGS.TRANSFER}</span>
        </Link>
        <Link href="/app/expenses/new" className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition">
           <PlusCircle className="text-red-500 mb-2" size={24} />
           <span className="font-medium text-xs md:text-sm text-gray-700">{STRINGS.ADD} {STRINGS.NAV_EXPENSES}</span>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Works */}
          <div className="bg-white rounded shadow p-4">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                  <Clock className="mr-2 text-yellow-600" size={20} />
                  დაგეგმილი სამუშაოები
              </h3>
              <div className="space-y-3">
                  {pendingWorks.map(w => (
                      <Link href={`/app/works/${w.id}`} key={w.id} className="block border-b last:border-0 pb-2 last:pb-0 hover:bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                              <span className="font-bold text-gray-800">{w.work_types?.name || '-'}</span>
                              <span className="text-xs text-gray-500">{w.planned_date}</span>
                          </div>
                          <div className="text-sm text-gray-600">{w.fields?.name || '-'}</div>
                      </Link>
                  ))}
                  {pendingWorks.length === 0 && <div className="text-sm text-gray-400">დაგეგმილი სამუშაოები არ არის.</div>}
              </div>
              <div className="mt-4 text-center">
                  <Link href="/app/works" className="text-sm text-green-600 font-medium hover:underline">ყველას ნახვა &rarr;</Link>
              </div>
          </div>

          {/* Recent Harvests */}
          <div className="bg-white rounded shadow p-4">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                  <Leaf className="mr-2 text-green-600" size={20} />
                  ბოლო მოსავალი
              </h3>
              <div className="space-y-3">
                  {recentLots.map(l => (
                      <Link href={`/app/lots/${l.id}`} key={l.id} className="block border-b last:border-0 pb-2 last:pb-0 hover:bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                              <span className="font-bold text-gray-800">{l.lot_code}</span>
                              <span className="font-bold text-green-700">{l.harvested_kg} კგ</span>
                          </div>
                          <div className="text-sm text-gray-600">{l.crops?.name_ka || '-'} / {l.varieties?.name || '-'}</div>
                      </Link>
                  ))}
                  {recentLots.length === 0 && <div className="text-sm text-gray-400">მონაცემები არ არის.</div>}
              </div>
              <div className="mt-4 text-center">
                  <Link href="/app/lots" className="text-sm text-green-600 font-medium hover:underline">ყველას ნახვა &rarr;</Link>
              </div>
          </div>
      </div>
    </div>
  );
}