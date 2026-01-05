'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

export default function VarietiesSettings() {
  const [varieties, setVarieties] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
      fetchVarieties(); 
      fetchCrops();
  }, []);

  const fetchCrops = async () => {
      const { data } = await supabase.from('crops').select('*');
      if(data) {
          setCrops(data);
          setSelectedCrop(data[0]?.id || '');
      }
  };

  const fetchVarieties = async () => {
    const { data } = await supabase.from('varieties').select('*, crops(name_ka)').order('created_at', { ascending: false });
    if(data) setVarieties(data);
  };

  const handleAdd = async () => {
    if(!newName || !selectedCrop) return;
    setLoading(true);
    
    await supabase.from('varieties').insert({
        crop_id: selectedCrop,
        name: newName
    });
    setNewName('');
    setLoading(false);
    fetchVarieties();
  };

  return (
    <div className="max-w-md">
       <h1 className="text-xl font-bold mb-6">ჯიშები</h1>
       
       <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <label className="block text-sm font-medium">{STRINGS.CROP}</label>
          <select 
            className="w-full border rounded p-2"
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
          >
              {crops.map(c => <option key={c.id} value={c.id}>{c.name_ka}</option>)}
          </select>

          <Input 
            placeholder="ჯიშის სახელი" 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
          />
          <Button onClick={handleAdd} disabled={loading} className="w-full">{STRINGS.ADD}</Button>
       </div>

       <div className="space-y-2">
           {varieties.map(v => (
               <div key={v.id} className="p-3 bg-white border rounded flex justify-between">
                   <span className="font-bold">{v.name}</span>
                   <span className="text-sm text-gray-500">{v.crops?.name_ka}</span>
               </div>
           ))}
       </div>
    </div>
  );
}
