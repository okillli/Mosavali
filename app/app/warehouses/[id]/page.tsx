'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, ConfirmDialog } from '../../../../components/ui';
import { Warehouse as WarehouseIcon, Box, Package, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
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

  // Edit Bin State
  const [editingBinId, setEditingBinId] = useState<string | null>(null);
  const [editBinName, setEditBinName] = useState('');

  // Delete States
  const [showDeleteWarehouseDialog, setShowDeleteWarehouseDialog] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(false);
  const [binToDelete, setBinToDelete] = useState<Bin | null>(null);
  const [deletingBin, setDeletingBin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const { data: wh, error: whError } = await supabase.from('warehouses').select('*').eq('id', id).single();

    if (whError || !wh) {
      console.error('Failed to fetch warehouse:', whError);
      setError(STRINGS.WAREHOUSE_NOT_FOUND);
      setLoading(false);
      return;
    }

    setWarehouse(wh);

    const { data: b } = await supabase.from('bins').select('*').eq('warehouse_id', id).order('created_at');
    if (b) setBins(b);

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
    setError(null);
    const { error: addError } = await supabase.from('bins').insert({
      warehouse_id: id,
      name: newBinName
    });

    if (addError) {
      console.error('Failed to add bin:', addError);
      setError(STRINGS.BIN_ADD_ERROR);
    } else {
      setNewBinName('');
      loadData();
    }
    setAddingBin(false);
  };

  const handleEditBin = async (binId: string) => {
    if (!editBinName.trim()) return;
    setError(null);
    const { error: editError } = await supabase.from('bins').update({ name: editBinName }).eq('id', binId);
    if (editError) {
      console.error('Failed to edit bin:', editError);
      setError(STRINGS.SAVE_ERROR);
    } else {
      setEditingBinId(null);
      setEditBinName('');
      loadData();
    }
  };

  const handleDeleteBin = async () => {
    if (!binToDelete) return;
    setDeletingBin(true);
    setError(null);
    const { error: deleteError } = await supabase.from('bins').delete().eq('id', binToDelete.id);
    if (deleteError) {
      console.error('Failed to delete bin:', deleteError);
      setError(STRINGS.DELETE_ERROR);
    } else {
      loadData();
    }
    setDeletingBin(false);
    setBinToDelete(null);
  };

  const handleDeleteWarehouse = async () => {
    setDeletingWarehouse(true);
    setError(null);
    const { error: deleteError } = await supabase.from('warehouses').delete().eq('id', id);
    if (deleteError) {
      console.error('Failed to delete warehouse:', deleteError);
      setError(STRINGS.DELETE_ERROR);
      setDeletingWarehouse(false);
      setShowDeleteWarehouseDialog(false);
    } else {
      router.push('/app/warehouses');
    }
  };

  const startEditBin = (bin: Bin) => {
    setEditingBinId(bin.id);
    setEditBinName(bin.name);
  };

  const cancelEditBin = () => {
    setEditingBinId(null);
    setEditBinName('');
  };

  const totalStock = useMemo(
    () => stock.reduce((sum, s) => sum + s.stock_kg, 0),
    [stock]
  );

  if (error && !warehouse) return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => router.push('/app/warehouses')} className="mb-4">&larr; {STRINGS.BACK}</Button>
      <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
    </div>
  );

  if (!warehouse) return <div className="p-4">{STRINGS.LOADING}</div>;

  const getBinStock = (binId: string) => {
    return stock.find(s => s.bin_id === binId) || null;
  };

  const getWarehouseDeleteWarning = (): string => {
    if (totalStock > 0) {
      return `${STRINGS.WAREHOUSE_HAS_STOCK} (${totalStock} ${STRINGS.UNIT_KG}). ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  const getBinDeleteWarning = (bin: Bin): string => {
    const binStock = getBinStock(bin.id);
    if (binStock && binStock.stock_kg > 0) {
      return `${STRINGS.BIN_STOCK_WARNING} (${binStock.stock_kg} ${STRINGS.UNIT_KG}). ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  return (
    <div>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.push('/app/warehouses')} className="mb-4">&larr; {STRINGS.BACK}</Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-gray-800">
              <WarehouseIcon className="mr-2" />
              {warehouse.name}
            </h1>
            <p className="text-gray-500">{warehouse.location_text || STRINGS.ADDRESS_NOT_SET}</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded border border-blue-100 text-right">
              <span className="block text-xs text-blue-600 uppercase font-bold">{STRINGS.STOCK}</span>
              <span className="text-xl font-bold text-blue-900">{totalStock} {STRINGS.UNIT_KG}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/app/warehouses/${id}/edit`)}
                className="flex items-center gap-1"
              >
                <Pencil size={16} />
                {STRINGS.EDIT}
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteWarehouseDialog(true)}
                className="flex items-center gap-1"
              >
                <Trash2 size={16} />
                {STRINGS.DELETE}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Bins List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center">
            <Box className="mr-2" size={20} />
            {STRINGS.BINS_SECTIONS}
          </h3>

          {bins.map(bin => {
            const binStock = getBinStock(bin.id);
            const isEditing = editingBinId === bin.id;

            return (
              <div key={bin.id} className="bg-white p-4 rounded shadow border">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editBinName}
                          onChange={e => setEditBinName(e.target.value)}
                          noMargin
                          className="flex-1"
                        />
                        <button
                          onClick={() => handleEditBin(bin.id)}
                          className="p-3 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEditBin}
                          className="p-3 text-gray-500 hover:bg-gray-50 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-lg flex items-center">
                          {bin.name}
                          {bin.is_default && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">DEFAULT</span>}
                        </div>
                        <div className="text-sm mt-1">
                          {binStock ? (
                            <span className="text-green-700 font-medium flex items-center">
                              <Package size={14} className="mr-1" />
                              {binStock.lots?.lot_code || '-'} ({binStock.lots?.crops?.name_ka || '-'})
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">{STRINGS.BIN_EMPTY}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {binStock ? (
                          <div className="font-mono font-bold text-lg">{binStock.stock_kg} <span className="text-xs">{STRINGS.UNIT_KG}</span></div>
                        ) : (
                          <div className="text-gray-300">-</div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditBin(bin)}
                          className="p-3 text-gray-500 hover:bg-gray-100 rounded"
                          title={STRINGS.EDIT}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setBinToDelete(bin)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={binStock && binStock.stock_kg > 0 ? STRINGS.BIN_HAS_STOCK : STRINGS.DELETE}
                          disabled={binStock && binStock.stock_kg > 0}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Bin Sidebar */}
        <div>
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">{STRINGS.ADD_BIN}</h3>
            <div className="space-y-2">
              <Input
                placeholder={STRINGS.BIN_NAME_PLACEHOLDER}
                value={newBinName}
                onChange={e => setNewBinName(e.target.value)}
                className="bg-white"
              />
              <Button onClick={handleAddBin} disabled={addingBin || !newBinName} className="w-full flex justify-center items-center">
                <Plus size={16} className="mr-1" /> {STRINGS.ADD}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {STRINGS.BIN_ADD_HINT}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Warehouse Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteWarehouseDialog}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={`${STRINGS.DELETE_WAREHOUSE_CONFIRM} "${warehouse.name}"? ${getWarehouseDeleteWarning()}`}
        confirmLabel={STRINGS.DELETE}
        cancelLabel={STRINGS.CANCEL}
        variant="danger"
        onConfirm={handleDeleteWarehouse}
        onCancel={() => setShowDeleteWarehouseDialog(false)}
        isLoading={deletingWarehouse}
      />

      {/* Delete Bin Confirmation */}
      <ConfirmDialog
        isOpen={!!binToDelete}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={binToDelete ? `${STRINGS.DELETE_BIN_CONFIRM} "${binToDelete.name}"? ${getBinDeleteWarning(binToDelete)}` : ''}
        confirmLabel={STRINGS.DELETE}
        cancelLabel={STRINGS.CANCEL}
        variant="danger"
        onConfirm={handleDeleteBin}
        onCancel={() => setBinToDelete(null)}
        isLoading={deletingBin}
      />
    </div>
  );
}
