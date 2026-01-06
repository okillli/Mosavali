'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../../lib/supabaseClient';
import { STRINGS } from '../../../../../lib/strings';
import { WarehouseForm } from '../../../../../components/forms/WarehouseForm';
import { Warehouse } from '../../../../../types';

export default function EditWarehousePage() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWarehouse();
    }
  }, [id]);

  const fetchWarehouse = async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert(STRINGS.LOAD_ERROR);
    } else {
      setWarehouse(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">{STRINGS.LOADING}</div>;
  }

  if (!warehouse) {
    return <div className="p-4">{STRINGS.WAREHOUSE_NOT_FOUND}</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.EDIT} - {warehouse.name}</h1>
      <WarehouseForm mode="edit" initialData={warehouse} />
    </div>
  );
}
