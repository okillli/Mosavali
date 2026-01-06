'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { Sprout, Tractor, DollarSign, Calendar } from 'lucide-react';

export default function FieldDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [field, setField] = useState<any>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, WORKS, LOTS

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    // Fetch Field
    const { data: f } = await supabase.from('fields').select('*').eq('id', id).single();
    setField(f);

    // Fetch Works
    const { data: w } = await supabase.from('works')
        .select('*, work_types(name)')
        .eq('field_id', id)
        .order('planned_date', { ascending: false });
    if(w) setWorks(w);

    // Fetch Lots (Harvests)
    const { data: l } = await supabase.from('lots')
        .select('*, crops(name_ka), varieties(name)')
        .eq('field_id', id)
        .order('harvest_date', { ascending: false });
    if(l) setLots(l);
  };

  if (!field) return <div className="p-4">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.push('/app/fields')} className="mb-4">&larr; უკან</Button>
        <h1 className="text-2xl font-bold flex items-center">
            <Sprout className="mr-2 text-green-600" />
            {field.name}
        </h1>
        <p className="text-gray-500">{field.area_ha} ჰა • {field.ownership === 'OWNED' ? STRINGS.OWNED : STRINGS.RENTED}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'OVERVIEW' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('OVERVIEW')}
          >
            მიმოხილვა
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'WORKS' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('WORKS')}
          >
            {STRINGS.NAV_WORKS} ({works.length})
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'LOTS' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
            onClick={() => setActiveTab('LOTS')}
          >
            {STRINGS.NAV_LOTS} ({lots.length})
          </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'OVERVIEW' && (
            <div className="bg-white p-6 rounded shadow space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">ლოკაცია / აღწერა</h3>
                    <p>{field.location_text || '-'}</p>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">{STRINGS.NOTES}</h3>
                    <p>{field.notes || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 p-4 rounded text-center">
                        <Tractor className="mx-auto mb-2 text-blue-500" />
                        <span className="block font-bold text-xl">{works.length}</span>
                        <span className="text-xs text-gray-500">სულ სამუშაო</span>
                    </div>
                    <div className="bg-green-50 p-4 rounded text-center">
                        <DollarSign className="mx-auto mb-2 text-green-500" />
                        <span className="block font-bold text-xl">
                            {lots.reduce((sum, l) => sum + l.harvested_kg, 0).toLocaleString()} {STRINGS.UNIT_KG}
                        </span>
                        <span className="text-xs text-gray-500">სულ მოსავალი</span>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'WORKS' && (
            <div className="space-y-2">
                {works.map(w => (
                    <div key={w.id} className="bg-white p-3 rounded border flex justify-between">
                        <div>
                            <div className="font-bold">{w.work_types?.name || '-'}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Calendar size={12} className="mr-1"/> {w.planned_date}
                            </div>
                        </div>
                        <div className="text-sm">{w.status === 'COMPLETED' ? STRINGS.COMPLETED : STRINGS.PLANNED}</div>
                    </div>
                ))}
                {works.length === 0 && <div className="text-center text-gray-500 py-4">ჩანაწერები არ არის</div>}
            </div>
        )}

        {activeTab === 'LOTS' && (
            <div className="space-y-2">
                {lots.map(l => (
                    <div key={l.id} className="bg-white p-3 rounded border flex justify-between">
                         <div>
                            <div className="font-bold">{l.lot_code}</div>
                            <div className="text-sm">{l.crops?.name_ka || '-'} / {l.varieties?.name || '-'}</div>
                        </div>
                        <div className="text-right">
                             <div className="font-bold">{l.harvested_kg} {STRINGS.UNIT_KG}</div>
                             <div className="text-xs text-gray-500">{l.harvest_date}</div>
                        </div>
                    </div>
                ))}
                {lots.length === 0 && <div className="text-center text-gray-500 py-4">ჩანაწერები არ არის</div>}
            </div>
        )}
      </div>
    </div>
  );
}
