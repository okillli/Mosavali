'use client';
import React, { useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export default function NewFieldPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    area_ha: '',
    location_text: '',
    ownership: 'OWNED', // OWNED | RENTED
    notes: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      alert('პროფილის მონაცემები ვერ მოიძებნა.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('fields').insert({
      farm_id: profile.farm_id,
      name: formData.name,
      area_ha: parseFloat(formData.area_ha),
      location_text: formData.location_text,
      ownership: formData.ownership,
      notes: formData.notes
    });

    if (error) {
      console.error('Insert error:', error);
      alert(STRINGS.INVALID_VALUE + ': ' + error.message);
      setLoading(false);
    } else {
      router.push('/app/fields');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_FIELDS}</h1>
      
      <div className="bg-white p-6 rounded shadow space-y-4">
        <Input 
          label={STRINGS.FIELD_NAME} 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="მაგ: ზედა ყანა"
        />
        
        <Input 
          label={STRINGS.FIELD_AREA} 
          type="number"
          step="0.01"
          value={formData.area_ha}
          onChange={e => setFormData({...formData, area_ha: e.target.value})}
        />

        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.FIELD_OWNERSHIP}</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.ownership}
            onChange={e => setFormData({...formData, ownership: e.target.value})}
          >
            <option value="OWNED">{STRINGS.OWNED}</option>
            <option value="RENTED">{STRINGS.RENTED}</option>
          </select>
        </div>

        <Input 
          label="ლოკაცია" 
          value={formData.location_text}
          onChange={e => setFormData({...formData, location_text: e.target.value})}
        />

        <Input 
          label={STRINGS.NOTES} 
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
        />

        <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => router.back()}>{STRINGS.CANCEL}</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !formData.name || !formData.area_ha}>
                {loading ? '...' : STRINGS.SAVE}
            </Button>
        </div>
      </div>
    </div>
  );
}