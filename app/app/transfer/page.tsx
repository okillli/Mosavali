'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { StockViewWithRelations, BinWithWarehouse } from '../../../types';

export default function TransferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stock, setStock] = useState<StockViewWithRelations[]>([]);
  const [targetBins, setTargetBins] = useState<BinWithWarehouse[]>([]);

  const [formData, setFormData] = useState({
    lot_id: '',
    from_bin_id: '',
    to_bin_id: '',
    weight_kg: '',
    movement_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch stock, lots, and bins separately (views can't be joined in PostgREST)
    const [stockRes, lotsRes, binsRes] = await Promise.all([
      supabase.from('v_bin_lot_stock').select('*'),
      supabase.from('lots').select('id, lot_code'),
      supabase.from('bins').select('*, warehouses(name)')
    ]);

    // Combine stock with related data
    if (stockRes.data && lotsRes.data && binsRes.data) {
      const lotsMap = new Map(lotsRes.data.map(l => [l.id, l]));
      const binsMap = new Map(binsRes.data.map(b => [b.id, b]));

      const stockWithRelations: StockViewWithRelations[] = stockRes.data.map(s => ({
        ...s,
        lots: lotsMap.get(s.lot_id),
        bins: binsMap.get(s.bin_id)
      }));
      setStock(stockWithRelations);
    }

    if (binsRes.data) setTargetBins(binsRes.data);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      setError(STRINGS.PROFILE_NOT_FOUND);
      setLoading(false);
      return;
    }

    const { error: moveError } = await supabase.from('inventory_movements').insert({
      farm_id: profile.farm_id,
      lot_id: formData.lot_id,
      type: 'TRANSFER',
      from_bin_id: formData.from_bin_id,
      to_bin_id: formData.to_bin_id,
      weight_kg: parseFloat(formData.weight_kg),
      movement_date: formData.movement_date,
      reason: STRINGS.INTERNAL_TRANSFER
    });

    if (moveError) {
      console.error('Transfer error:', moveError);
      if (moveError.message.includes('შერევა')) {
        setError(STRINGS.NO_MIXING_ERROR);
      } else if (moveError.message.includes('მარაგი')) {
        setError(STRINGS.NEGATIVE_STOCK_ERROR);
      } else {
        setError(moveError.message);
      }
      setLoading(false);
    } else {
      router.push('/app/reports');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.TRANSFER}</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      
      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.FROM} ({STRINGS.STOCK})</label>
          <select 
            className="w-full border rounded p-2"
            onChange={e => {
              const item = stock.find(s => (s.lot_id + s.bin_id) === e.target.value);
              if (item) setFormData({...formData, lot_id: item.lot_id, from_bin_id: item.bin_id, weight_kg: item.stock_kg});
            }}
          >
            <option value="">{STRINGS.SELECT_OPTION}</option>
            {stock.map(s => (
                <option key={s.lot_id + s.bin_id} value={s.lot_id + s.bin_id}>
                    {s.lots?.lot_code} @ {s.bins?.warehouses?.name}/{s.bins?.name} ({s.stock_kg} {STRINGS.UNIT_KG})
                </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{STRINGS.TO}</label>
          <select 
            className="w-full border rounded p-2"
            value={formData.to_bin_id}
            onChange={e => setFormData({...formData, to_bin_id: e.target.value})}
          >
            <option value="">{STRINGS.SELECT_OPTION}</option>
            {targetBins.filter(b => b.id !== formData.from_bin_id).map(b => (
                <option key={b.id} value={b.id}>
                    {b.warehouses.name} - {b.name}
                </option>
            ))}
          </select>
        </div>

        <Input 
          label={STRINGS.UNIT_KG}
          type="number"
          value={formData.weight_kg}
          onChange={e => setFormData({...formData, weight_kg: e.target.value})}
        />

        <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => router.back()}>{STRINGS.CANCEL}</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={loading || !formData.to_bin_id || !formData.lot_id}>
                {loading ? '...' : STRINGS.SAVE}
            </Button>
        </div>
      </div>
    </div>
  );
}
