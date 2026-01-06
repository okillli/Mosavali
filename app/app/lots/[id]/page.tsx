'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button, ConfirmDialog } from '../../../../components/ui';
import { Package, MapPin, History, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Lot, StockViewWithRelations, InventoryMovement, Sale } from '../../../../types';

export default function LotDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lot, setLot] = useState<Lot | null>(null);
  const [stock, setStock] = useState<StockViewWithRelations[]>([]);
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const { data: l, error: lotError } = await supabase.from('lots')
      .select('*, crops(name_ka), varieties(name), fields(name)')
      .eq('id', id)
      .single();

    if (lotError || !l) {
      console.error('Failed to fetch lot:', lotError);
      setError(STRINGS.LOT_NOT_FOUND);
      setLoading(false);
      return;
    }

    setLot(l);

    const { data: s } = await supabase.from('v_bin_lot_stock')
      .select('*, bins(name, warehouses(name))')
      .eq('lot_id', id);
    if (s) setStock(s);

    const { data: h } = await supabase.from('inventory_movements')
      .select('*, from_bin:bins!from_bin_id(name, warehouses(name)), to_bin:bins!to_bin_id(name, warehouses(name))')
      .eq('lot_id', id)
      .order('created_at', { ascending: false });
    if (h) setHistory(h);

    // Check for sales
    const { data: salesData } = await supabase.from('sales')
      .select('id')
      .eq('lot_id', id);
    if (salesData) setSales(salesData);

    setLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    // First delete related inventory movements
    await supabase.from('inventory_movements').delete().eq('lot_id', id);

    // Then delete the lot
    const { error: deleteError } = await supabase.from('lots').delete().eq('id', id);

    if (deleteError) {
      console.error('Failed to delete lot:', deleteError);
      setError(STRINGS.DELETE_ERROR);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    } else {
      router.push('/app/lots');
    }
  };

  const currentTotalStock = useMemo(
    () => stock.reduce((acc, curr) => acc + curr.stock_kg, 0),
    [stock]
  );

  const getDeleteWarning = (): string => {
    const warnings: string[] = [];

    if (currentTotalStock > 0) {
      warnings.push(`${STRINGS.LOT_HAS_STOCK} (${currentTotalStock} ${STRINGS.UNIT_KG})`);
    }
    if (sales.length > 0) {
      warnings.push(`${STRINGS.LOT_HAS_SALES} (${sales.length})`);
    }
    if (warnings.length > 0) {
      return warnings.join('. ') + '. ' + STRINGS.DELETE_CANNOT_UNDO;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  if (error && !lot) return (
    <div className="p-4">
      <Button variant="secondary" onClick={() => router.push('/app/lots')} className="mb-4">&larr; {STRINGS.BACK}</Button>
      <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
    </div>
  );

  if (!lot) return <div className="p-4">{STRINGS.LOADING}</div>;

  return (
    <div>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.back()} className="mb-4">&larr; {STRINGS.BACK}</Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-green-800">
              <Package className="mr-2" />
              {lot.lot_code}
            </h1>
            <p className="text-gray-600 font-medium">{lot.crops?.name_ka || '-'} / {lot.varieties?.name || '-'}</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="text-right">
              <span className="block text-sm text-gray-500">{STRINGS.HARVEST_DATE}</span>
              <span className="font-bold">{lot.harvest_date}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/app/lots/${id}/edit`)}
                className="flex items-center gap-1"
              >
                <Pencil size={16} />
                {STRINGS.EDIT}
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1"
                disabled={sales.length > 0}
                title={sales.length > 0 ? STRINGS.LOT_DELETE_DISABLED : ''}
              >
                <Trash2 size={16} />
                {STRINGS.DELETE}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Info Card */}
        <div className="bg-white p-6 rounded shadow space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{STRINGS.NAV_FIELDS}</span>
            <span className="font-medium">{lot.fields?.name || '-'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{STRINGS.INITIAL_WEIGHT}</span>
            <span className="font-medium">{lot.harvested_kg} {STRINGS.UNIT_KG}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{STRINGS.CURRENT_BALANCE}</span>
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
            {STRINGS.LOCATION}
          </h3>
          {stock.length === 0 ? (
            <p className="text-gray-500 text-sm">{STRINGS.STOCK_ZERO}</p>
          ) : (
            <div className="space-y-3">
              {stock.map((item) => (
                <div key={item.bin_id} className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                  <div>
                    <div className="font-bold text-blue-900">{item.bins?.warehouses?.name || '-'}</div>
                    <div className="text-sm text-blue-700">{item.bins?.name || '-'}</div>
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
        {STRINGS.MOVEMENT_HISTORY}
      </h3>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b">
            <tr>
              <th className="px-6 py-3">{STRINGS.TABLE_DATE}</th>
              <th className="px-6 py-3">{STRINGS.TABLE_TYPE}</th>
              <th className="px-6 py-3">{STRINGS.TABLE_FROM_TO}</th>
              <th className="px-6 py-3 text-right">{STRINGS.WEIGHT}</th>
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
                    {move.type === 'RECEIVE' ? STRINGS.MOVEMENT_RECEIVE :
                      move.type === 'SALE_OUT' ? STRINGS.MOVEMENT_SALE :
                        move.type === 'TRANSFER' ? STRINGS.MOVEMENT_TRANSFER : move.type}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600 flex items-center">
                  {move.from_bin ? `${move.from_bin.warehouses?.name || '-'} (${move.from_bin.name})` : '-'}
                  <ArrowRight size={14} className="mx-2 text-gray-400" />
                  {move.to_bin ? `${move.to_bin.warehouses?.name || '-'} (${move.to_bin.name})` : '-'}
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  {move.weight_kg} კგ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={`${STRINGS.DELETE_LOT_CONFIRM} "${lot.lot_code}"? ${getDeleteWarning()}`}
        confirmLabel={STRINGS.DELETE}
        cancelLabel={STRINGS.CANCEL}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
