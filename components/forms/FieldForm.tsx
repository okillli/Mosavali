'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { STRINGS } from '../../lib/strings';
import { Input, Button, Select, TextArea } from '../ui';
import { Field } from '../../types';

interface FieldFormProps {
  mode: 'add' | 'edit';
  initialData?: Field;
}

interface FieldFormData {
  name: string;
  area_ha: string;
  location_text: string;
  ownership: string;
  notes: string;
}

export const FieldForm: React.FC<FieldFormProps> = ({ mode, initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FieldFormData>({
    name: initialData?.name || '',
    area_ha: initialData?.area_ha?.toString() || '',
    location_text: initialData?.location_text || '',
    ownership: initialData?.ownership || 'OWNED',
    notes: initialData?.notes || ''
  });

  const handleSubmit = async () => {
    setLoading(true);

    if (mode === 'add') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('farm_id')
        .single();

      if (profileError || !profile) {
        alert('პროფილის მონაცემები ვერ მოიძებნა.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('fields').insert({
        farm_id: profile.farm_id,
        name: formData.name,
        area_ha: parseFloat(formData.area_ha),
        location_text: formData.location_text || null,
        ownership: formData.ownership,
        notes: formData.notes || null
      });

      if (error) {
        alert(STRINGS.SAVE_ERROR + ': ' + error.message);
        setLoading(false);
      } else {
        router.push('/app/fields');
      }
    } else {
      // Edit mode
      const { error } = await supabase
        .from('fields')
        .update({
          name: formData.name,
          area_ha: parseFloat(formData.area_ha),
          location_text: formData.location_text || null,
          ownership: formData.ownership,
          notes: formData.notes || null
        })
        .eq('id', initialData!.id);

      if (error) {
        alert(STRINGS.SAVE_ERROR + ': ' + error.message);
        setLoading(false);
      } else {
        router.push(`/app/fields/${initialData!.id}`);
      }
    }
  };

  const ownershipOptions = [
    { value: 'OWNED', label: STRINGS.OWNED },
    { value: 'RENTED', label: STRINGS.RENTED }
  ];

  const isValid = formData.name.trim() !== '' && formData.area_ha !== '';

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <Input
        label={STRINGS.FIELD_NAME}
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="მაგ: ზედა ყანა"
      />

      <Input
        label={STRINGS.FIELD_AREA}
        type="number"
        step="0.01"
        value={formData.area_ha}
        onChange={e => setFormData({ ...formData, area_ha: e.target.value })}
      />

      <Select
        label={STRINGS.FIELD_OWNERSHIP}
        value={formData.ownership}
        onChange={e => setFormData({ ...formData, ownership: e.target.value })}
        options={ownershipOptions}
      />

      <Input
        label="ლოკაცია"
        value={formData.location_text}
        onChange={e => setFormData({ ...formData, location_text: e.target.value })}
      />

      <TextArea
        label={STRINGS.NOTES}
        value={formData.notes}
        onChange={e => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" className="flex-1" onClick={() => router.back()}>
          {STRINGS.CANCEL}
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={loading || !isValid}>
          {loading ? '...' : STRINGS.SAVE}
        </Button>
      </div>
    </div>
  );
};
