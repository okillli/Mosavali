'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { CheckCircle2, Clock, Tractor } from 'lucide-react';

export default function WorkDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [work, setWork] = useState<any>(null);
  
  // Completion form state
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    if (id) fetchWork();
  }, [id]);

  const fetchWork = async () => {
    const { data } = await supabase.from('works')
        .select('*, fields(name), work_types(name), seasons(year)')
        .eq('id', id)
        .single();
    if (data) {
        setWork(data);
        if(data.notes) setCompletionNotes(data.notes);
    }
  };

  const markCompleted = async () => {
      const { error } = await supabase.from('works').update({
          status: 'COMPLETED',
          completed_date: completedDate,
          notes: completionNotes
      }).eq('id', id);

      if(!error) {
          fetchWork();
      }
  };

  if(!work) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
        <Button variant="secondary" onClick={() => router.back()} className="mb-4">&larr; უკან</Button>
        
        <div className="bg-white rounded shadow overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Tractor className="text-green-700" />
                        {work.work_types.name}
                    </h1>
                    <p className="text-gray-600 mt-1">{STRINGS.NAV_FIELDS}: {work.fields.name}</p>
                </div>
                <div>
                    {work.status === 'COMPLETED' ? (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                            <CheckCircle2 size={16} className="mr-1" /> {STRINGS.COMPLETED}
                         </span>
                    ) : (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">
                            <Clock size={16} className="mr-1" /> {STRINGS.PLANNED}
                         </span>
                    )}
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
                        <div className="text-lg">{work.seasons.year}</div>
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
                        <Button onClick={markCompleted} className="w-full mt-2">
                            დასრულებულად მონიშვნა
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
    </div>
  );
}