'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Buyer, StockView, Season } from '../../../../types';

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stock, setStock] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [formData, setFormData] = useState({
    season_id: '',
    buyer_id: '',
    lot_id: '',
    bin_id: '', // Selected based on lot
    sale_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    price_per_kg: '',
    notes: ''
  });

  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Fetch available stock via view
    const { data: stockData } = await supabase.from('v_bin_lot_stock')
        .select('*, lots(lot_code, crop_id, variety_id), bins(name, warehouse_id, warehouses(name))');
    
    // Fetch buyers
    const { data: buyersData } = await supabase.from('buyers').select('*');
    
    // Fetch seasons
    const { data: seasonData } = await supabase.from('seasons').select('*').order('year', {ascending: false});

    if (stockData) setStock(stockData);
    if (buyersData) setBuyers(buyersData);
    if (seasonData) {
        setSeasons(seasonData);
        setFormData(p => ({ ...p, season_id: seasonData.find(s => s.is_current)?.id || seasonData[0]?.id }));
    }
  };

  const handleStockSelect = (stockItem: any) => {
    setSelectedStockItem(stockItem);
    setFormData(prev => ({
        ...prev,
        lot_id: stockItem.lot_id,
        bin_id: stockItem.bin_id,
        weight_kg: stockItem.stock_kg // Default to max
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      setError('პროფილის მონაცემები ვერ მოიძებნა.');
      setLoading(false);
      return;
    }

    // Call RPC
    const { data, error: rpcError } = await supabase.rpc('create_sale_atomic', {
      p_farm_id: profile.farm_id,
      p_season_id: formData.season_id,
      p_lot_id: formData.lot_id,
      p_bin_id: formData.bin_id,
      p_buyer_id: formData.buyer_id,
      p_sale_date: formData.sale_date,
      p_weight_kg: parseFloat(formData.weight_kg),
      p_price_per_kg: parseFloat(formData.price_per_kg),
      p_notes: formData.notes
    });

    if (rpcError) {
      setLoading(false);
      if (rpcError.message.includes('მარაგი არასაკმარისია')) {
        setError(STRINGS.NEGATIVE_STOCK_ERROR);
      } else {
        setError(STRINGS.INVALID_VALUE);
      }
    } else {
      router.push('/app/sales');
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_SALES}</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      
      <div className="bg-white p-6 rounded shadow space-y-4">
        {/* Lot Selection */}
        <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.NAV_LOTS} / {STRINGS.STOCK}</label>
            <select 
                className="w-full border rounded p-2" 
                onChange={e => {
                    const item = stock.find(s => s.lot_id === e.target.value);
                    if(item) handleStockSelect(item);
                }}
            >
                <option value="">{STRINGS.SELECT_OPTION}</option>
                {stock.map(s => (
                    <option key={s.lot_id + s.bin_id} value={s.lot_id}>
                        {s.lots.lot_code} - {s.bins.warehouses.name}/{s.bins.name} ({s.stock_kg} {STRINGS.UNIT_KG})
                    </option>
                ))}
            </select>
        </div>

        {/* Buyer */}
        <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.BUYER}</label>
            <select 
                className="w-full border rounded p-2" 
                value={formData.buyer_id} 
                onChange={e => setFormData({...formData, buyer_id: e.target.value})}
            >
                <option value="">{STRINGS.SELECT_OPTION}</option>
                {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {/* Quick Add Buyer could go here */}
        </div>

        <Input 
            label={STRINGS.HARVEST_WEIGHT} 
            type="number" 
            value={formData.weight_kg}
            onChange={e => setFormData({...formData, weight_kg: e.target.value})}
        />
        {selectedStockItem && (
            <p className="text-xs text-gray-500 -mt-3 mb-2 text-right">
                Max: {selectedStockItem.stock_kg} {STRINGS.UNIT_KG}
            </p>
        )}

        <Input 
            label={STRINGS.PRICE_PER_KG} 
            type="number" 
            step="0.01"
            value={formData.price_per_kg}
            onChange={e => setFormData({...formData, price_per_kg: e.target.value})}
        />

        <div className="bg-gray-50 p-3 rounded text-right font-bold text-lg">
           {STRINGS.TOTAL}: {((parseFloat(formData.weight_kg) || 0) * (parseFloat(formData.price_per_kg) || 0)).toFixed(2)} {STRINGS.CURRENCY}
        </div>

        <Input 
            type="date" 
            value={formData.sale_date}
            onChange={e => setFormData({...formData, sale_date: e.target.value})}
        />
        
        <Input 
            label={STRINGS.NOTES} 
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
        />

        <Button className="w-full" onClick={handleSubmit} disabled={loading || !formData.lot_id || !formData.buyer_id}>
            {loading ? '...' : STRINGS.SAVE}
        </Button>
      </div>
    </div>
  );
}
