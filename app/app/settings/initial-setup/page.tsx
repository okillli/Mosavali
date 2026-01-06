'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Warehouse, Bin } from '../../../../types';
import { Package, AlertCircle, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';

interface WarehouseWithBins extends Warehouse {
  bins: Bin[];
}

interface LotOption {
  id: string;
  lot_code: string;
  crops?: { name_ka: string } | null;
  varieties?: { name: string } | null;
}

interface InitialBalance {
  id: string;
  lot_id: string;
  bin_id: string;
  weight_kg: number;
  lot_code: string;
  crop_name: string;
  bin_name: string;
  warehouse_name: string;
}

export default function InitialSetupPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [warehouses, setWarehouses] = useState<WarehouseWithBins[]>([]);
  const [lots, setLots] = useState<LotOption[]>([]);
  const [initialBalances, setInitialBalances] = useState<InitialBalance[]>([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBin, setSelectedBin] = useState('');
  const [selectedLot, setSelectedLot] = useState('');
  const [weight, setWeight] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<InitialBalance | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [warehousesRes, lotsRes, movementsRes, binsRes] = await Promise.all([
        supabase.from('warehouses').select('*, bins(*)').order('name'),
        supabase.from('lots').select('*, crops(name_ka), varieties(name)').order('harvest_date', { ascending: false }),
        supabase.from('inventory_movements').select('*').eq('type', 'ADJUSTMENT').eq('reason', STRINGS.INITIAL_BALANCE),
        supabase.from('bins').select('*, warehouses(name)')
      ]);

      if (warehousesRes.error) throw warehousesRes.error;
      if (lotsRes.error) throw lotsRes.error;
      if (movementsRes.error) throw movementsRes.error;
      if (binsRes.error) throw binsRes.error;

      setWarehouses(warehousesRes.data || []);
      setLots(lotsRes.data || []);

      // Build initial balances list from existing ADJUSTMENT movements
      type BinWithWarehouse = { id: string; name: string; warehouses?: { name: string } | null };
      const binsMap = new Map<string, BinWithWarehouse>(binsRes.data?.map(b => [b.id, b as BinWithWarehouse]) || []);
      const lotsMap = new Map<string, LotOption>(lotsRes.data?.map(l => [l.id, l as LotOption]) || []);

      const balances: InitialBalance[] = (movementsRes.data || []).map(m => {
        const lot = lotsMap.get(m.lot_id);
        const bin = binsMap.get(m.to_bin_id);
        return {
          id: m.id,
          lot_id: m.lot_id,
          bin_id: m.to_bin_id,
          weight_kg: m.weight_kg,
          lot_code: lot?.lot_code || '',
          crop_name: lot?.crops?.name_ka || '',
          bin_name: bin?.name || '',
          warehouse_name: bin?.warehouses?.name || ''
        };
      });

      setInitialBalances(balances);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(STRINGS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const availableBins = useMemo(() => {
    if (!selectedWarehouse) return [];
    const warehouse = warehouses.find(w => w.id === selectedWarehouse);
    return warehouse?.bins || [];
  }, [selectedWarehouse, warehouses]);

  const handleAddBalance = async () => {
    if (!selectedBin || !selectedLot || !weight) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('farm_id')
        .single();

      if (profileError || !profile) {
        throw new Error(STRINGS.PROFILE_NOT_FOUND);
      }

      const { error: insertError } = await supabase.from('inventory_movements').insert({
        farm_id: profile.farm_id,
        type: 'ADJUSTMENT',
        lot_id: selectedLot,
        to_bin_id: selectedBin,
        weight_kg: parseFloat(weight),
        movement_date: new Date().toISOString().split('T')[0],
        reason: STRINGS.INITIAL_BALANCE
      });

      if (insertError) {
        if (insertError.message.includes('შერევა')) {
          throw new Error(STRINGS.NO_MIXING_ERROR);
        }
        throw insertError;
      }

      setSuccess(STRINGS.INITIAL_STOCK_ADDED);
      setSelectedLot('');
      setWeight('');

      // Refresh the balances list
      await fetchData();
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : STRINGS.SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBalance = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('inventory_movements')
        .delete()
        .eq('id', deleteTarget.id);

      if (deleteError) throw deleteError;

      // Check if bin still has stock after deletion
      const { data: stockData } = await supabase
        .from('v_bin_lot_stock')
        .select('stock_kg')
        .eq('bin_id', deleteTarget.bin_id);

      // If no stock remains, clear the active_lot_id on the bin
      const totalStock = stockData?.reduce((sum, s) => sum + (s.stock_kg || 0), 0) || 0;
      if (totalStock === 0) {
        await supabase
          .from('bins')
          .update({ active_lot_id: null })
          .eq('id', deleteTarget.bin_id);
      }

      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      setError(STRINGS.DELETE_ERROR);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">{STRINGS.LOADING}</div>;
  }

  const hasWarehouses = warehouses.length > 0 && warehouses.some(w => w.bins?.length > 0);
  const hasLots = lots.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Package className="mr-2 text-green-600" size={24} />
          {STRINGS.PAGE_INITIAL_SETUP}
        </h1>
        <p className="text-gray-500 mt-1">{STRINGS.INITIAL_SETUP_DESCRIPTION}</p>
      </div>

      {/* Hints if prerequisites are missing */}
      {!hasWarehouses && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-yellow-800">{STRINGS.NO_WAREHOUSES_HINT}</p>
            <Link href="/app/warehouses" className="text-green-600 underline mt-1 inline-block">
              {STRINGS.NAV_WAREHOUSES} &rarr;
            </Link>
          </div>
        </div>
      )}

      {!hasLots && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-yellow-800">{STRINGS.NO_LOTS_HINT}</p>
            <Link href="/app/lots" className="text-green-600 underline mt-1 inline-block">
              {STRINGS.NAV_LOTS} &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Add Balance Form */}
      {hasWarehouses && hasLots && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="font-semibold mb-4">{STRINGS.ADD_INITIAL_STOCK}</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4 flex items-center gap-2">
              <Check size={18} />
              {success}
            </div>
          )}

          <div className="space-y-4">
            <Select
              label={STRINGS.SELECT_WAREHOUSE}
              value={selectedWarehouse}
              onChange={e => {
                setSelectedWarehouse(e.target.value);
                setSelectedBin('');
              }}
              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            />

            <Select
              label={STRINGS.SELECT_BIN}
              value={selectedBin}
              onChange={e => setSelectedBin(e.target.value)}
              options={availableBins.map(b => ({ value: b.id, label: b.name }))}
              disabled={!selectedWarehouse}
            />

            <Select
              label={STRINGS.SELECT_LOT}
              value={selectedLot}
              onChange={e => setSelectedLot(e.target.value)}
              options={lots.map(l => ({
                value: l.id,
                label: `${l.lot_code} - ${l.crops?.name_ka || ''} ${l.varieties?.name ? `(${l.varieties.name})` : ''}`
              }))}
            />

            <Input
              label={STRINGS.ENTER_CURRENT_STOCK}
              type="number"
              min="0.01"
              step="0.01"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="0.00"
            />

            <Button
              onClick={handleAddBalance}
              disabled={saving || !selectedBin || !selectedLot || !weight}
              className="w-full"
            >
              {saving ? '...' : STRINGS.ADD_INITIAL_STOCK}
            </Button>
          </div>
        </div>
      )}

      {/* List of Added Initial Balances */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="font-semibold mb-4">{STRINGS.CURRENT_INITIAL_BALANCES}</h2>

        {initialBalances.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{STRINGS.NO_INITIAL_BALANCES}</p>
        ) : (
          <div className="space-y-3">
            {initialBalances.map(balance => (
              <div
                key={balance.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{balance.lot_code}</div>
                  <div className="text-sm text-gray-500">
                    {balance.crop_name} @ {balance.warehouse_name}/{balance.bin_name}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-green-600">
                    {balance.weight_kg.toLocaleString()} {STRINGS.UNIT_KG}
                  </span>
                  <button
                    onClick={() => setDeleteTarget(balance)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    title={STRINGS.DELETE}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={deleteTarget ? `${STRINGS.DELETE} "${deleteTarget.lot_code}" @ ${deleteTarget.warehouse_name}/${deleteTarget.bin_name}?` : ''}
        variant="danger"
        onConfirm={handleDeleteBalance}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
