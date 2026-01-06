'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { STRINGS } from '../../lib/strings';
import { Input, Button, TextArea } from '../ui';
import { Warehouse } from '../../types';

interface WarehouseFormProps {
  mode: 'add' | 'edit';
  initialData?: Warehouse;
}

interface WarehouseFormData {
  name: string;
  location_text: string;
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({ mode, initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: initialData?.name || '',
    location_text: initialData?.location_text || ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (mode === 'add') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('farm_id')
        .single();

      if (profileError || !profile) {
        setError('პროფილის მონაცემები ვერ მოიძებნა.');
        setLoading(false);
        return;
      }

      // Create Warehouse
      const { data: wh, error: whError } = await supabase.from('warehouses').insert({
        farm_id: profile.farm_id,
        name: formData.name,
        location_text: formData.location_text || null
      }).select().single();

      if (whError) {
        setError(STRINGS.SAVE_ERROR + ': ' + whError.message);
        setLoading(false);
        return;
      }

      // Create Default Bin
      await supabase.from('bins').insert({
        warehouse_id: wh.id,
        name: 'სექცია 1',
        is_default: true
      });

      router.push('/app/warehouses');
    } else {
      // Edit mode
      const { error } = await supabase
        .from('warehouses')
        .update({
          name: formData.name,
          location_text: formData.location_text || null
        })
        .eq('id', initialData!.id);

      if (error) {
        setError(STRINGS.SAVE_ERROR + ': ' + error.message);
        setLoading(false);
      } else {
        router.push(`/app/warehouses/${initialData!.id}`);
      }
    }
  };

  const isValid = formData.name.trim() !== '';

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}

      <Input
        label={STRINGS.WAREHOUSE_NAME}
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="მაგ: მთავარი საწყობი"
      />

      <TextArea
        label="მისამართი / აღწერა"
        value={formData.location_text}
        onChange={e => setFormData({ ...formData, location_text: e.target.value })}
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
