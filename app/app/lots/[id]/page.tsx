'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { Package, MapPin, History, ArrowRight } from 'lucide-react';

export default function LotDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lot, setLot] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    // 1. Lot Details
    const { data: l } = await supabase.from('lots')
        .select('*, crops(name_ka), varieties(name), fields(name)')
        .eq('id', id)
        .single();
    setLot(l);

    // 2. Current Stock Location
    const { data: s } = await supabase.from('v_bin_lot_stock')
        .select('*, bins(name, warehouses(name))')
        .eq('lot_id', id);
    if (s) setStock(s);

    // 3. Movement History
    const { data: h } = await supabase.from('inventory_movements')
        .select('*, from_bin:bins!from_bin_id(name, warehouses(name)), to_bin:bins!to_bin_id(name, warehouses(name))')
        .eq('lot_id', id)
        .order('created_at', { ascending: false });
    if (h) setHistory(h);

    setLoading(false);
  };

  if (!lot) return <div className="p-4">Loading...</div>;

  const currentTotalStock = stock.reduce((acc, curr) => acc + curr.stock_kg, 0);

  return (
    <div>
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.back()} className="mb-4">&larr; უკან</Button>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold flex items-center text-green-800">
                    <Package className="mr-2" />
                    {lot.lot_code}
                </h1>
                <p className="text-gray-600 font-medium">{lot.crops?.name_ka || '-'} / {lot.varieties?.name || '-'}</p>
            </div>
            <div className="text-right">
                <span className="block text-sm text-gray-500">{STRINGS.HARVEST_DATE}</span>
                <span className="font-bold">{lot.harvest_date}</span>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
         {/* Info Card */}
         <div className="bg-white p-6 rounded shadow space-y-3">
             <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">{STRINGS.NAV_FIELDS}</span>
                 <span className="font-medium">{lot.fields?.name}</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">საწყისი წონა</span>
                 <span className="font-medium">{lot.harvested_kg} {STRINGS.UNIT_KG}</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">მიმდინარე ნაშთი</span>
                 <span className={`font-bold ${currentTotalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {currentTotalStock} {STRINGS.UNIT_KG}
                 </span>
             </div>
             {lot.notes && (
                 <div className="pt-2">
                     <span className="text-xs text-gray-400 uppercase block mb-1">{STRINGS.NOTES}</span>
                     <p className="text-sm bg-gray-50 p-2 rounded">{lot.notes}</p>
                 </div>
             )}
         </div>

         {/* Current Location */}
         <div className="bg-white p-6 rounded shadow">
             <h3 className="text-lg font-bold mb-4 flex items-center text-gray-700">
                 <MapPin size={20} className="mr-2" />
                 ადგილმდებარეობა
             </h3>
             {stock.length === 0 ? (
                 <p className="text-gray-500 text-sm">ნაშთი განულებულია (გაიყიდა ან გადავიდა).</p>
             ) : (
                 <div className="space-y-3">
                     {stock.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                             <div>
                                 <div className="font-bold text-blue-900">{item.bins.warehouses.name}</div>
                                 <div className="text-sm text-blue-700">{item.bins.name}</div>
                             </div>
                             <div className="font-mono font-bold text-lg">
                                 {item.stock_kg} <span className="text-xs font-normal">კგ</span>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
         </div>
      </div>

      {/* History */}
      <h3 className="text-xl font-bold mb-4 flex items-center">
          <History size={20} className="mr-2" />
          მოძრაობის ისტორია
      </h3>
      <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr>
                      <th className="px-6 py-3">თარიღი</th>
                      <th className="px-6 py-3">ტიპი</th>
                      <th className="px-6 py-3">საიდან &rarr; სად</th>
                      <th className="px-6 py-3 text-right">წონა</th>
                  </tr>
              </thead>
              <tbody className="divide-y">
                  {history.map((move) => (
                      <tr key={move.id}>
                          <td className="px-6 py-3">{move.movement_date}</td>
                          <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold 
                                  ${move.type === 'RECEIVE' ? 'bg-green-100 text-green-800' : 
                                    move.type === 'SALE_OUT' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                  {move.type === 'RECEIVE' ? 'მიღება' : 
                                   move.type === 'SALE_OUT' ? 'გაყიდვა' : 
                                   move.type === 'TRANSFER' ? 'გადატანა' : move.type}
                              </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600 flex items-center">
                              {move.from_bin ? `${move.from_bin.warehouses.name} (${move.from_bin.name})` : '-'}
                              <ArrowRight size={14} className="mx-2 text-gray-400" />
                              {move.to_bin ? `${move.to_bin.warehouses.name} (${move.to_bin.name})` : '-'}
                          </td>
                          <td className="px-6 py-3 text-right font-medium">
                              {move.weight_kg} კგ
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}