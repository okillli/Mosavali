'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Check } from 'lucide-react';

export default function SeasonsSettings() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [newYear, setNewYear] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSeasons(); }, []);

  const fetchSeasons = async () => {
    const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false });
    if(data) setSeasons(data);
  };

  const handleAdd = async () => {
    if(!newYear) return;
    setLoading(true);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      alert('პროფილის მონაცემები ვერ მოიძებნა. გთხოვთ შეამოწმოთ მონაცემთა ბაზა.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('seasons').insert({
        farm_id: profile.farm_id,
        year: parseInt(newYear),
        is_current: false
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      alert('სეზონის დამატება ვერ მოხერხდა: ' + insertError.message);
    }

    setNewYear('');
    setLoading(false);
    fetchSeasons();
  };

  const setAsCurrent = async (id: string) => {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      alert('პროფილის მონაცემები ვერ მოიძებნა.');
      return;
    }

    // Reset all
    await supabase.from('seasons').update({ is_current: false }).eq('farm_id', profile.farm_id);
    // Set new
    await supabase.from('seasons').update({ is_current: true }).eq('id', id);
    fetchSeasons();
  };

  return (
    <div className="max-w-md">
       <h1 className="text-xl font-bold mb-6">სეზონები</h1>
       
       <div className="flex gap-2 mb-6">
          <Input 
            placeholder="წელი (მაგ: 2027)" 
            type="number" 
            value={newYear} 
            onChange={e => setNewYear(e.target.value)}
            className="mb-0" 
          />
          <Button onClick={handleAdd} disabled={loading}>{STRINGS.ADD}</Button>
       </div>

       <div className="bg-white rounded shadow divide-y">
           {seasons.map(s => (
               <div key={s.id} className="p-4 flex justify-between items-center">
                   <div className="font-bold text-lg">
                       {s.year}
                       {s.is_current && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">მიმდინარე</span>}
                   </div>
                   {!s.is_current && (
                       <button onClick={() => setAsCurrent(s.id)} className="text-sm text-blue-600 hover:underline">
                           მიმდინარედ მონიშვნა
                       </button>
                   )}
                   {s.is_current && <Check className="text-green-600" size={20} />}
               </div>
           ))}
       </div>
    </div>
  );
}
