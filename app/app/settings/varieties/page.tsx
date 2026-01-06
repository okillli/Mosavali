'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button, Input, ConfirmDialog } from '../../../../components/ui';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { VarietyWithCrop, Crop } from '../../../../types';

export default function VarietiesSettings() {
  const [varieties, setVarieties] = useState<VarietyWithCrop[]>([]);
  const [lotsCount, setLotsCount] = useState<Record<string, number>>({});
  const [crops, setCrops] = useState<Crop[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCropId, setEditCropId] = useState('');

  // Delete state
  const [varietyToDelete, setVarietyToDelete] = useState<VarietyWithCrop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
      fetchVarieties();
      fetchCrops();
  }, []);

  const fetchCrops = async () => {
      const { data } = await supabase.from('crops').select('*').order('name_ka');
      if(data) {
          setCrops(data);
          setSelectedCrop(data[0]?.id || '');
      }
  };

  const fetchVarieties = async () => {
    const [varietiesRes, lotsRes] = await Promise.all([
      supabase.from('varieties')
        .select('*, crops(name_ka)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('lots')
        .select('variety_id')
    ]);

    if (varietiesRes.data) {
      setVarieties(varietiesRes.data);

      // Calculate counts client-side
      const counts: Record<string, number> = {};
      varietiesRes.data.forEach(variety => {
        counts[variety.id] = 0;
      });

      if (lotsRes.data) {
        lotsRes.data.forEach(lot => {
          if (counts[lot.variety_id] !== undefined) {
            counts[lot.variety_id]++;
          }
        });
      }
      setLotsCount(counts);
    }
  };

  const handleAdd = async () => {
    if(!newName || !selectedCrop) return;
    setLoading(true);

    const { error } = await supabase.from('varieties').insert({
        crop_id: selectedCrop,
        name: newName
    });

    if (error) {
      console.error('Insert error:', error);
      alert(STRINGS.ADD_VARIETY_ERROR + ': ' + error.message);
    }

    setNewName('');
    setLoading(false);
    fetchVarieties();
  };

  const startEdit = (variety: VarietyWithCrop) => {
    setEditingId(variety.id);
    setEditName(variety.name);
    setEditCropId(variety.crop_id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCropId('');
  };

  const handleEdit = async (varietyId: string) => {
    if (!editName.trim()) return;

    const { error } = await supabase.from('varieties').update({
      name: editName,
      crop_id: editCropId
    }).eq('id', varietyId);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
    } else {
      setEditingId(null);
      fetchVarieties();
    }
  };

  const handleDelete = async () => {
    if (!varietyToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from('varieties').delete().eq('id', varietyToDelete.id);

    if (error) {
      alert(STRINGS.DELETE_ERROR + ': ' + error.message);
    } else {
      fetchVarieties();
    }
    setIsDeleting(false);
    setVarietyToDelete(null);
  };

  const getDeleteWarning = (variety: VarietyWithCrop): string => {
    const count = lotsCount[variety.id] || 0;
    if (count > 0) {
      return `${STRINGS.VARIETY_HAS_LOTS} (${count}). ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  return (
    <div className="max-w-md">
       <h1 className="text-xl font-bold mb-6">{STRINGS.PAGE_VARIETIES}</h1>

       <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <label className="block text-sm font-medium">{STRINGS.CROP}</label>
          <select
            className="w-full border rounded p-2"
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
          >
              {crops.map(c => <option key={c.id} value={c.id}>{c.name_ka}</option>)}
          </select>

          <Input
            placeholder={STRINGS.VARIETY_NAME_PLACEHOLDER}
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={loading} className="w-full">{STRINGS.ADD}</Button>
       </div>

       <div className="space-y-2">
           {varieties.map(v => {
             const isEditing = editingId === v.id;

             return (
               <div key={v.id} className="p-3 bg-white border rounded">
                 {isEditing ? (
                   <div className="space-y-2">
                     <select
                       className="w-full border rounded p-2"
                       value={editCropId}
                       onChange={e => setEditCropId(e.target.value)}
                     >
                       {crops.map(c => <option key={c.id} value={c.id}>{c.name_ka}</option>)}
                     </select>
                     <Input
                       value={editName}
                       onChange={e => setEditName(e.target.value)}
                       placeholder={STRINGS.VARIETY_NAME_PLACEHOLDER}
                       className="!mb-2"
                     />
                     <div className="flex gap-2">
                       <button
                         onClick={() => handleEdit(v.id)}
                         className="p-3 text-green-600 hover:bg-green-50 rounded"
                       >
                         <Check size={18} />
                       </button>
                       <button
                         onClick={cancelEdit}
                         className="p-3 text-gray-500 hover:bg-gray-50 rounded"
                       >
                         <X size={18} />
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex justify-between items-center">
                     <div>
                       <span className="font-bold">{v.name}</span>
                       <span className="text-sm text-gray-500 ml-2">{v.crops?.name_ka}</span>
                     </div>
                     <div className="flex gap-1">
                       <button
                         onClick={() => startEdit(v)}
                         className="p-3 text-gray-500 hover:bg-gray-100 rounded"
                         title={STRINGS.EDIT}
                       >
                         <Pencil size={16} />
                       </button>
                       <button
                         onClick={() => setVarietyToDelete(v)}
                         className="p-3 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                         title={STRINGS.DELETE}
                         disabled={lotsCount[v.id] > 0}
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             );
           })}
       </div>

       {/* Delete Confirmation */}
       <ConfirmDialog
         isOpen={!!varietyToDelete}
         title={STRINGS.DELETE_CONFIRM_TITLE}
         message={varietyToDelete ? `${STRINGS.DELETE_VARIETY_CONFIRM} "${varietyToDelete.name}"? ${getDeleteWarning(varietyToDelete)}` : ''}
         confirmLabel={STRINGS.DELETE}
         cancelLabel={STRINGS.CANCEL}
         variant="danger"
         onConfirm={handleDelete}
         onCancel={() => setVarietyToDelete(null)}
         isLoading={isDeleting}
       />
    </div>
  );
}
