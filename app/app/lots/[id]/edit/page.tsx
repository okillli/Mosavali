'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { STRINGS } from '../../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button, Select, TextArea } from '../../../../../components/ui';
import { Lot, Crop, Variety, Field, Season } from '../../../../../types';

export default function EditLotPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lot, setLot] = useState<Lot | null>(null);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [formData, setFormData] = useState({
    season_id: '',
    crop_id: '',
    variety_id: '',
    field_id: '',
    harvest_date: '',
    harvested_kg: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Load lot
    const { data: lotData } = await supabase.from('lots').select('*').eq('id', id).single();
    if (lotData) {
      setLot(lotData);
      setFormData({
        season_id: lotData.season_id,
        crop_id: lotData.crop_id,
        variety_id: lotData.variety_id,
        field_id: lotData.field_id,
        harvest_date: lotData.harvest_date,
        harvested_kg: lotData.harvested_kg.toString(),
        notes: lotData.notes || ''
      });
    }

    // Load master data
    const { data: s } = await supabase.from('seasons').select('*').order('year', { ascending: false });
    const { data: c } = await supabase.from('crops').select('*');
    const { data: f } = await supabase.from('fields').select('*');

    if (s) setSeasons(s);
    if (c) setCrops(c);
    if (f) setFields(f);

    // Load varieties for the lot's crop
    if (lotData?.crop_id) {
      const { data: v } = await supabase.from('varieties').select('*').eq('crop_id', lotData.crop_id);
      if (v) setVarieties(v);
    }

    setInitialLoading(false);
  };

  useEffect(() => {
    if (formData.crop_id && !initialLoading) {
      supabase.from('varieties').select('*').eq('crop_id', formData.crop_id)
        .then(({ data }) => setVarieties(data || []));
    }
  }, [formData.crop_id]);

  const handleSubmit = async () => {
    setLoading(true);

    const { error } = await supabase.from('lots').update({
      season_id: formData.season_id,
      crop_id: formData.crop_id,
      variety_id: formData.variety_id,
      field_id: formData.field_id,
      harvest_date: formData.harvest_date,
      harvested_kg: parseFloat(formData.harvested_kg),
      notes: formData.notes || null
    }).eq('id', id);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
      setLoading(false);
    } else {
      router.push(`/app/lots/${id}`);
    }
  };

  if (initialLoading) return <div className="p-4">{STRINGS.LOADING}</div>;
  if (!lot) return <div className="p-4">{STRINGS.LOT_NOT_FOUND}</div>;

  const seasonOptions = seasons.map(s => ({ value: s.id, label: s.year.toString() }));
  const cropOptions = crops.map(c => ({ value: c.id, label: c.name_ka }));
  const varietyOptions = varieties.map(v => ({ value: v.id, label: v.name }));
  const fieldOptions = fields.map(f => ({ value: f.id, label: f.name }));

  const isValid = formData.crop_id && formData.variety_id && formData.field_id && formData.harvested_kg;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.EDIT} - {lot.lot_code}</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <Select
          label={STRINGS.SEASON}
          value={formData.season_id}
          onChange={e => setFormData({ ...formData, season_id: e.target.value })}
          options={seasonOptions}
        />

        <Select
          label={STRINGS.CROP}
          value={formData.crop_id}
          onChange={e => setFormData({ ...formData, crop_id: e.target.value, variety_id: '' })}
          options={cropOptions}
          placeholder={STRINGS.SELECT_OPTION}
        />

        <Select
          label={STRINGS.VARIETY}
          value={formData.variety_id}
          onChange={e => setFormData({ ...formData, variety_id: e.target.value })}
          options={varietyOptions}
          placeholder={STRINGS.SELECT_OPTION}
        />

        <Select
          label={STRINGS.NAV_FIELDS}
          value={formData.field_id}
          onChange={e => setFormData({ ...formData, field_id: e.target.value })}
          options={fieldOptions}
          placeholder={STRINGS.SELECT_OPTION}
        />

        <Input
          label={STRINGS.HARVEST_DATE}
          type="date"
          value={formData.harvest_date}
          onChange={e => setFormData({ ...formData, harvest_date: e.target.value })}
        />

        <Input
          label={STRINGS.HARVEST_WEIGHT}
          type="number"
          value={formData.harvested_kg}
          onChange={e => setFormData({ ...formData, harvested_kg: e.target.value })}
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
    </div>
  );
}
