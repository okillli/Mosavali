'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useRouter } from 'next/navigation';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Crop, Variety, Field, Warehouse, Bin, Season } from '../../../../types';

export default function NewLotPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = Harvest Info, 2 = Receive Info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data Selects
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    season_id: '',
    crop_id: '',
    variety_id: '',
    field_id: '',
    harvest_date: new Date().toISOString().split('T')[0],
    harvested_kg: '',
    notes: '',
    warehouse_id: '',
    bin_id: '',
  });

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    const { data: s } = await supabase.from('seasons').select('*').order('year', { ascending: false });
    const { data: c } = await supabase.from('crops').select('*');
    const { data: f } = await supabase.from('fields').select('*');
    const { data: w } = await supabase.from('warehouses').select('*');
    
    if (s) { setSeasons(s); setFormData(p => ({ ...p, season_id: s.find((x:any) => x.is_current)?.id || s[0]?.id })); }
    if (c) setCrops(c);
    if (f) setFields(f);
    if (w) setWarehouses(w);
  };

  useEffect(() => {
    if (formData.crop_id) {
       supabase.from('varieties').select('*').eq('crop_id', formData.crop_id)
       .then(({data}) => setVarieties(data || []));
    }
  }, [formData.crop_id]);

  useEffect(() => {
    if (formData.warehouse_id) {
        supabase.from('bins').select('*').eq('warehouse_id', formData.warehouse_id)
        .then(({data}) => setBins(data || []));
    }
  }, [formData.warehouse_id]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    let createdLotId = null;

    try {
      // Get farm_id first
      const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();
      if (profileError || !profile) {
        throw new Error('პროფილის მონაცემები ვერ მოიძებნა.');
      }

      const lotCode = `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

      // 1. Create Lot
      const { data: lot, error: lotError } = await supabase.from('lots').insert({
        farm_id: profile.farm_id,
        season_id: formData.season_id,
        crop_id: formData.crop_id,
        variety_id: formData.variety_id,
        field_id: formData.field_id,
        lot_code: lotCode,
        harvest_date: formData.harvest_date,
        harvested_kg: parseFloat(formData.harvested_kg),
        notes: formData.notes
      }).select().single();

      if (lotError) throw lotError;
      createdLotId = lot.id;

      // 2. Create Movement (Receive)
      const { error: moveError } = await supabase.from('inventory_movements').insert({
        farm_id: profile.farm_id,
        lot_id: lot.id,
        type: 'RECEIVE',
        to_bin_id: formData.bin_id,
        movement_date: formData.harvest_date,
        weight_kg: parseFloat(formData.harvested_kg)
      });

      if (moveError) {
          throw moveError;
      }

      router.push('/app/lots');
    } catch (err: any) {
      // Rollback: Delete orphan lot if movement failed
      if (createdLotId) {
          await supabase.from('lots').delete().eq('id', createdLotId);
      }
      
      const msg = err.message || '';
      if (msg.includes('შერევა')) {
          setError(STRINGS.NO_MIXING_ERROR);
      } else if (msg.includes('row-level security')) {
          setError('უფლების შეცდომა (RLS).');
      } else {
          setError(STRINGS.INVALID_VALUE);
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">{STRINGS.ADD} {STRINGS.NAV_LOTS}</h1>
        <div className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.SEASON}</label>
            <select className="w-full border rounded p-2" value={formData.season_id} onChange={e => setFormData({...formData, season_id: e.target.value})}>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.year}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.CROP}</label>
            <select className="w-full border rounded p-2" value={formData.crop_id} onChange={e => setFormData({...formData, crop_id: e.target.value})}>
               <option value="">{STRINGS.SELECT_OPTION}</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name_ka}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.VARIETY}</label>
            <select className="w-full border rounded p-2" value={formData.variety_id} onChange={e => setFormData({...formData, variety_id: e.target.value})}>
              <option value="">{STRINGS.SELECT_OPTION}</option>
              {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.NAV_FIELDS}</label>
            <select className="w-full border rounded p-2" value={formData.field_id} onChange={e => setFormData({...formData, field_id: e.target.value})}>
              <option value="">{STRINGS.SELECT_OPTION}</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <Input 
            label={STRINGS.HARVEST_DATE} 
            type="date" 
            value={formData.harvest_date} 
            onChange={e => setFormData({...formData, harvest_date: e.target.value})} 
          />
          <Input 
            label={STRINGS.HARVEST_WEIGHT} 
            type="number" 
            value={formData.harvested_kg} 
            onChange={e => setFormData({...formData, harvested_kg: e.target.value})} 
          />
           <Input 
            label={STRINGS.NOTES} 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
          />
          
          <Button 
            className="w-full mt-4" 
            onClick={() => {
              if(!formData.crop_id || !formData.variety_id || !formData.field_id || !formData.harvested_kg) return;
              setStep(2);
            }}
          >
            {STRINGS.SAVE} & {STRINGS.RECEIVE_INTO_WAREHOUSE}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
        <h1 className="text-xl font-bold mb-4">{STRINGS.RECEIVE_INTO_WAREHOUSE}</h1>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
        <div className="bg-white p-6 rounded shadow space-y-4">
            <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.NAV_WAREHOUSES}</label>
            <select className="w-full border rounded p-2" value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})}>
              <option value="">{STRINGS.SELECT_OPTION}</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.BIN_NAME}</label>
            <select className="w-full border rounded p-2" value={formData.bin_id} onChange={e => setFormData({...formData, bin_id: e.target.value})}>
              <option value="">{STRINGS.SELECT_OPTION}</option>
              {bins.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="text-sm text-gray-500">
             {STRINGS.HARVEST_WEIGHT}: {formData.harvested_kg} {STRINGS.UNIT_KG}
          </div>

          <div className="flex gap-2 pt-4">
             <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">{STRINGS.CANCEL}</Button>
             <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                 {loading ? '...' : STRINGS.SAVE}
             </Button>
          </div>
        </div>
    </div>
  );
}