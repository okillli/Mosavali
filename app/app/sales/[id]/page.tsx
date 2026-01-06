'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { useParams, useRouter } from 'next/navigation';
import { Button, ConfirmDialog } from '../../../../components/ui';
import { User, Calendar, FileText, Pencil, Trash2 } from 'lucide-react';
import { SaleWithRelations } from '../../../../types';

export default function SaleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<SaleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from('sales')
        .select('*, buyers(name, phone), lots(lot_code, crops(name_ka), varieties(name))')
        .eq('id', id)
        .single();
    setSale(data);
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
      setUpdating(true);
      const { error } = await supabase.from('sales').update({ payment_status: status }).eq('id', id);
      if (!error) {
          setSale({ ...sale, payment_status: status } as SaleWithRelations);
      }
      setUpdating(false);
  };

  const handleDelete = async () => {
    if (!sale || !sale.lot_id) {
      alert(STRINGS.DELETE_ERROR);
      return;
    }

    setIsDeleting(true);

    // First delete the associated inventory movement (SALE_OUT)
    const { error: movementError } = await supabase.from('inventory_movements')
      .delete()
      .eq('type', 'SALE_OUT')
      .eq('lot_id', sale.lot_id)
      .eq('sale_id', id);

    if (movementError) {
      alert(STRINGS.DELETE_ERROR + ': ' + movementError.message);
      setIsDeleting(false);
      setShowDeleteDialog(false);
      return;
    }

    // Then delete the sale
    const { error } = await supabase.from('sales').delete().eq('id', id);

    if (error) {
      alert(STRINGS.DELETE_ERROR + ': ' + error.message);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    } else {
      router.push('/app/sales');
    }
  };

  if (!sale) return <div className="p-4">{STRINGS.LOADING}</div>;

  const getStatusColor = (status: string) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'PART_PAID') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'PAID') return STRINGS.PAID;
    if (status === 'PART_PAID') return STRINGS.PART_PAID;
    return STRINGS.UNPAID;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
         <Button variant="secondary" onClick={() => router.push('/app/sales')}>&larr; {STRINGS.BACK}</Button>
         <div className="flex items-center gap-3">
             <div className={`px-4 py-1 rounded-full border font-bold text-sm ${getStatusColor(sale.payment_status)}`}>
                 {getStatusLabel(sale.payment_status)}
             </div>
             <div className="flex gap-2">
                 <Button
                     variant="outline"
                     onClick={() => router.push(`/app/sales/${id}/edit`)}
                     className="flex items-center gap-1"
                 >
                     <Pencil size={16} />
                     {STRINGS.EDIT}
                 </Button>
                 <Button
                     variant="danger"
                     onClick={() => setShowDeleteDialog(true)}
                     className="flex items-center gap-1"
                 >
                     <Trash2 size={16} />
                     {STRINGS.DELETE}
                 </Button>
             </div>
         </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b p-6 flex justify-between items-start">
              <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                      <User className="mr-2 text-gray-500" />
                      {sale.buyers?.name || '-'}
                  </h1>
                  <p className="text-gray-500 ml-8">{sale.buyers?.phone || STRINGS.PHONE_NOT_SET}</p>
              </div>
              <div className="text-right">
                  <div className="flex items-center text-gray-500 justify-end mb-1">
                      <Calendar size={16} className="mr-2" />
                      {sale.sale_date}
                  </div>
                  <div className="text-xs text-gray-400">ID: {sale.id.slice(0,8)}</div>
              </div>
          </div>

          {/* Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">{STRINGS.NAV_LOTS}</h3>
                  <div className="bg-blue-50 p-4 rounded border border-blue-100">
                      <div className="font-bold text-blue-900">{sale.lots?.lot_code || '-'}</div>
                      <div className="text-blue-700">{sale.lots?.crops?.name_ka || '-'} - {sale.lots?.varieties?.name || '-'}</div>
                  </div>
                  <div className="mt-4 space-y-2">
                      <div className="flex justify-between border-b border-gray-100 pb-1">
                          <span className="text-gray-600">{STRINGS.WEIGHT}</span>
                          <span className="font-medium">{sale.weight_kg} {STRINGS.UNIT_KG}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1">
                          <span className="text-gray-600">{STRINGS.PRICE_PER_KG_SHORT}</span>
                          <span className="font-medium">{sale.price_per_kg} {STRINGS.CURRENCY}</span>
                      </div>
                  </div>
              </div>

              <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">{STRINGS.FINANCES}</h3>
                  <div className="bg-green-50 p-6 rounded border border-green-100 text-center">
                      <div className="text-sm text-green-600 mb-1">{STRINGS.TOTAL_TO_PAY}</div>
                      <div className="text-3xl font-bold text-green-800">
                          {sale.total_gel.toLocaleString()} {STRINGS.CURRENCY}
                      </div>
                  </div>

                  {/* Status Actions */}
                  <div className="mt-6">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{STRINGS.CHANGE_STATUS}</label>
                      <div className="grid grid-cols-3 gap-2">
                          <button 
                             onClick={() => updateStatus('UNPAID')}
                             disabled={updating || sale.payment_status === 'UNPAID'}
                             className={`py-2 text-xs font-bold rounded border ${sale.payment_status === 'UNPAID' ? 'bg-red-600 text-white border-red-600' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                          >
                              {STRINGS.UNPAID}
                          </button>
                          <button 
                             onClick={() => updateStatus('PART_PAID')}
                             disabled={updating || sale.payment_status === 'PART_PAID'}
                             className={`py-2 text-xs font-bold rounded border ${sale.payment_status === 'PART_PAID' ? 'bg-yellow-500 text-white border-yellow-500' : 'text-yellow-600 border-yellow-200 hover:bg-yellow-50'}`}
                          >
                              {STRINGS.PART_PAID}
                          </button>
                          <button 
                             onClick={() => updateStatus('PAID')}
                             disabled={updating || sale.payment_status === 'PAID'}
                             className={`py-2 text-xs font-bold rounded border ${sale.payment_status === 'PAID' ? 'bg-green-600 text-white border-green-600' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                          >
                              {STRINGS.PAID}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
          
          {sale.notes && (
              <div className="bg-gray-50 p-4 border-t text-sm text-gray-600 flex items-start">
                  <FileText size={16} className="mr-2 mt-0.5 text-gray-400" />
                  {sale.notes}
              </div>
          )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
          isOpen={showDeleteDialog}
          title={STRINGS.DELETE_CONFIRM_TITLE}
          message={`${STRINGS.DELETE_SALE_CONFIRM} ${sale.buyers?.name || ''}-ს (${sale.weight_kg} ${STRINGS.UNIT_KG})? ${STRINGS.DELETE_CANNOT_UNDO}`}
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