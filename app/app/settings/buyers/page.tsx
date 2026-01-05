'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

export default function BuyersSettings() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBuyers(); }, []);

  const fetchBuyers = async () => {
    const { data } = await supabase.from('buyers').select('*').order('created_at', { ascending: false });
    if(data) setBuyers(data);
  };

  const handleAdd = async () => {
    if(!newName) return;
    setLoading(true);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      alert('პროფილის მონაცემები ვერ მოიძებნა.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('buyers').insert({
        farm_id: profile.farm_id,
        name: newName,
        phone: newPhone
    });

    if (error) {
      console.error('Insert error:', error);
      alert('მყიდველის დამატება ვერ მოხერხდა: ' + error.message);
    }

    setNewName('');
    setNewPhone('');
    setLoading(false);
    fetchBuyers();
  };

  return (
    <div className="max-w-md">
       <h1 className="text-xl font-bold mb-6">მყიდველები</h1>
       
       <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <Input 
            placeholder="მყიდველის სახელი / კომპანია" 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
          />
          <Input 
            placeholder="ტელეფონი" 
            value={newPhone} 
            onChange={e => setNewPhone(e.target.value)} 
          />
          <Button onClick={handleAdd} disabled={loading} className="w-full">{STRINGS.ADD}</Button>
       </div>

       <div className="space-y-2">
           {buyers.map(b => (
               <div key={b.id} className="p-3 bg-white border rounded flex justify-between items-center">
                   <div>
                       <div className="font-bold">{b.name}</div>
                       <div className="text-xs text-gray-500">{b.phone}</div>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
}
