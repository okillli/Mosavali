'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { STRINGS } from '../../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Input, Button, Select, TextArea } from '../../../../../components/ui';
import { SaleWithRelations, Buyer } from '../../../../../types';

export default function EditSalePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sale, setSale] = useState<SaleWithRelations | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);

  const [formData, setFormData] = useState({
    buyer_id: '',
    sale_date: '',
    price_per_kg: '',
    payment_status: 'UNPAID',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    // Load sale
    const { data: saleData } = await supabase.from('sales')
      .select('*, lots(lot_code, crops(name_ka)), buyers(name)')
      .eq('id', id)
      .single();

    if (saleData) {
      setSale(saleData);
      setFormData({
        buyer_id: saleData.buyer_id,
        sale_date: saleData.sale_date,
        price_per_kg: saleData.price_per_kg.toString(),
        payment_status: saleData.payment_status,
        notes: saleData.notes || ''
      });
    }

    // Load buyers
    const { data: buyersData } = await supabase.from('buyers').select('*');
    if (buyersData) setBuyers(buyersData);

    setInitialLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const newPricePerKg = parseFloat(formData.price_per_kg);
    const newTotal = sale ? sale.weight_kg * newPricePerKg : 0;

    const { error } = await supabase.from('sales').update({
      buyer_id: formData.buyer_id,
      sale_date: formData.sale_date,
      price_per_kg: newPricePerKg,
      total_gel: newTotal,
      payment_status: formData.payment_status,
      notes: formData.notes || null
    }).eq('id', id);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
      setLoading(false);
    } else {
      router.push(`/app/sales/${id}`);
    }
  };

  if (initialLoading) return <div className="p-4">იტვირთება...</div>;
  if (!sale) return <div className="p-4">გაყიდვა ვერ მოიძებნა</div>;

  const buyerOptions = buyers.map(b => ({ value: b.id, label: b.name }));
  const statusOptions = [
    { value: 'UNPAID', label: STRINGS.UNPAID },
    { value: 'PART_PAID', label: STRINGS.PART_PAID },
    { value: 'PAID', label: STRINGS.PAID }
  ];

  const calculatedTotal = sale.weight_kg * parseFloat(formData.price_per_kg || '0');

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.EDIT} {STRINGS.NAV_SALES}</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        {/* Read-only lot info */}
        <div className="bg-gray-50 p-3 rounded border">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{STRINGS.NAV_LOTS}</label>
          <div className="font-medium">{sale.lots?.lot_code}</div>
          <div className="text-sm text-gray-600">{sale.lots?.crops?.name_ka}</div>
        </div>

        {/* Read-only weight */}
        <div className="bg-gray-50 p-3 rounded border">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">წონა</label>
          <div className="font-medium">{sale.weight_kg} {STRINGS.UNIT_KG}</div>
          <div className="text-xs text-gray-500">წონის შეცვლა შეუძლებელია</div>
        </div>

        <Select
          label={STRINGS.BUYER}
          value={formData.buyer_id}
          onChange={e => setFormData({ ...formData, buyer_id: e.target.value })}
          options={buyerOptions}
          placeholder={STRINGS.SELECT_OPTION}
        />

        <Input
          label="გაყიდვის თარიღი"
          type="date"
          value={formData.sale_date}
          onChange={e => setFormData({ ...formData, sale_date: e.target.value })}
        />

        <Input
          label={STRINGS.PRICE_PER_KG}
          type="number"
          step="0.01"
          value={formData.price_per_kg}
          onChange={e => setFormData({ ...formData, price_per_kg: e.target.value })}
        />

        <div className="bg-green-50 p-3 rounded text-right font-bold text-lg border border-green-100">
          {STRINGS.TOTAL}: {calculatedTotal.toFixed(2)} {STRINGS.CURRENCY}
        </div>

        <Select
          label={STRINGS.PAYMENT_STATUS}
          value={formData.payment_status}
          onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
          options={statusOptions}
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
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || !formData.buyer_id || !formData.price_per_kg || parseFloat(formData.price_per_kg) <= 0}>
            {loading ? '...' : STRINGS.SAVE}
          </Button>
        </div>
      </div>
    </div>
  );
}
