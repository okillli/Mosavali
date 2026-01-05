'use client';
import React, { useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export default function NewWarehousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location_text: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Get farm_id first
    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      setError('პროფილის მონაცემები ვერ მოიძებნა.');
      setLoading(false);
      return;
    }

    // 1. Create Warehouse
    const { data: wh, error: whError } = await supabase.from('warehouses').insert({
      farm_id: profile.farm_id,
      name: formData.name,
      location_text: formData.location_text
    }).select().single();

    if (whError) {
      console.error('Warehouse insert error:', whError);
      setError(STRINGS.INVALID_VALUE + ': ' + whError.message);
      setLoading(false);
      return;
    }

    // 2. Create Default Bin "სექცია 1"
    const { error: binError } = await supabase.from('bins').insert({
      warehouse_id: wh.id,
      name: 'სექცია 1',
      is_default: true
    });

    if (binError) {
      console.error('Bin insert error:', binError);
    }

    router.push('/app/warehouses');
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_WAREHOUSES}</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      
      <div className="bg-white p-6 rounded shadow space-y-4">
        <Input 
          label={STRINGS.WAREHOUSE_NAME} 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="მაგ: მთავარი საწყობი"
        />
        <Input 
          label="მისამართი / აღწერა" 
          value={formData.location_text}
          onChange={e => setFormData({...formData, location_text: e.target.value})}
        />
        
        <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => router.back()}>{STRINGS.CANCEL}</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !formData.name}>
                {loading ? '...' : STRINGS.SAVE}
            </Button>
        </div>
      </div>
    </div>
  );
}
