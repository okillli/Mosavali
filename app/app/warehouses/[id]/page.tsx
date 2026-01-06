'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Warehouse as WarehouseIcon, Box, Package, Plus } from 'lucide-react';
import type { Warehouse, Bin, StockViewWithRelations } from '../../../../types';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [bins, setBins] = useState<Bin[]>([]);
  const [stock, setStock] = useState<StockViewWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Bin State
  const [newBinName, setNewBinName] = useState('');
  const [addingBin, setAddingBin] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    // 1. Warehouse Details
    const { data: wh } = await supabase.from('warehouses').select('*').eq('id', id).single();
    setWarehouse(wh);

    // 2. Bins
    const { data: b } = await supabase.from('bins').select('*').eq('warehouse_id', id).order('created_at');
    if (b) setBins(b);

    // 3. Stock in this warehouse - filter by bin_ids since view doesn't have warehouse_id
    if (b && b.length > 0) {
      const binIds = b.map(bin => bin.id);
      const { data: s } = await supabase.from('v_bin_lot_stock')
          .select('*, lots(lot_code, crops(name_ka), varieties(name))')
          .in('bin_id', binIds);
      if (s) setStock(s);
    } else {
      setStock([]);
    }

    setLoading(false);
  };

  const handleAddBin = async () => {
      if (!newBinName) return;
      setAddingBin(true);
      const { error } = await supabase.from('bins').insert({
          warehouse_id: id,
          name: newBinName
      });

      if (error) {
          console.error('Bin insert error:', error);
          alert('სექციის დამატება ვერ მოხერხდა: ' + error.message);
      } else {
          setNewBinName('');
          loadData(); // Reload to see new bin
      }
      setAddingBin(false);
  };

  if (!warehouse) return <div className="p-4">Loading...</div>;

  const getBinStock = (binId: string) => {
      const item = stock.find(s => s.bin_id === binId);
      return item ? item : null;
  };

  const totalStock = stock.reduce((sum, s) => sum + s.stock_kg, 0);

  return (
    <div>
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.push('/app/warehouses')} className="mb-4">&larr; უკან</Button>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold flex items-center text-gray-800">
                    <Warehouse className="mr-2" />
                    {warehouse.name}
                </h1>
                <p className="text-gray-500">{warehouse.location_text || 'მისამართი მითითებული არ არის'}</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded border border-blue-100 text-right">
                <span className="block text-xs text-blue-600 uppercase font-bold">{STRINGS.STOCK}</span>
                <span className="text-xl font-bold text-blue-900">{totalStock} {STRINGS.UNIT_KG}</span>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          {/* Bins List */}
          <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-gray-700 flex items-center">
                  <Box className="mr-2" size={20}/>
                  სექციები (Bins)
              </h3>
              
              {bins.map(bin => {
                  const binStock = getBinStock(bin.id);
                  return (
                      <div key={bin.id} className="bg-white p-4 rounded shadow border flex justify-between items-center">
                          <div>
                              <div className="font-bold text-lg flex items-center">
                                  {bin.name}
                                  {bin.is_default && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">DEFAULT</span>}
                              </div>
                              <div className="text-sm mt-1">
                                  {binStock ? (
                                      <span className="text-green-700 font-medium flex items-center">
                                          <Package size={14} className="mr-1"/>
                                          {binStock.lots?.lot_code || '-'} ({binStock.lots?.crops?.name_ka || '-'})
                                      </span>
                                  ) : (
                                      <span className="text-gray-400 italic">ცარიელია</span>
                                  )}
                              </div>
                          </div>
                          <div className="text-right">
                              {binStock ? (
                                  <div className="font-mono font-bold text-lg">{binStock.stock_kg} <span className="text-xs">კგ</span></div>
                              ) : (
                                  <div className="text-gray-300">-</div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* Add Bin Sidebar */}
          <div>
              <div className="bg-gray-50 p-4 rounded border">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">სექციის დამატება</h3>
                  <div className="space-y-2">
                      <Input 
                        placeholder="მაგ: სილოსი 2" 
                        value={newBinName}
                        onChange={e => setNewBinName(e.target.value)}
                        className="bg-white"
                      />
                      <Button onClick={handleAddBin} disabled={addingBin || !newBinName} className="w-full flex justify-center items-center">
                          <Plus size={16} className="mr-1" /> დამატება
                      </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                      გამოიყენეთ სექციები საწყობში სხვადასხვა კულტურის ან ლოტის გასმიჯნად.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
}