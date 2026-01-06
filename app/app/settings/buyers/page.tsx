'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button, Input, ConfirmDialog } from '../../../../components/ui';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Buyer, Sale } from '../../../../types';

export default function BuyersSettings() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [salesCount, setSalesCount] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Delete state
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchBuyers(); }, []);

  const fetchBuyers = async () => {
    const { data } = await supabase.from('buyers').select('*').order('created_at', { ascending: false });
    if (data) {
      setBuyers(data);
      // Fetch sales count for each buyer
      const counts: Record<string, number> = {};
      for (const buyer of data) {
        const { count } = await supabase.from('sales').select('*', { count: 'exact', head: true }).eq('buyer_id', buyer.id);
        counts[buyer.id] = count || 0;
      }
      setSalesCount(counts);
    }
  };

  const handleAdd = async () => {
    if (!newName) return;
    setLoading(true);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      alert(STRINGS.PROFILE_NOT_FOUND);
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('buyers').insert({
      farm_id: profile.farm_id,
      name: newName,
      phone: newPhone || null
    });

    if (error) {
      alert(STRINGS.ADD_BUYER_ERROR + ': ' + error.message);
    }

    setNewName('');
    setNewPhone('');
    setLoading(false);
    fetchBuyers();
  };

  const startEdit = (buyer: Buyer) => {
    setEditingId(buyer.id);
    setEditName(buyer.name);
    setEditPhone(buyer.phone || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPhone('');
  };

  const handleEdit = async (buyerId: string) => {
    if (!editName.trim()) return;

    const { error } = await supabase.from('buyers').update({
      name: editName,
      phone: editPhone || null
    }).eq('id', buyerId);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
    } else {
      setEditingId(null);
      fetchBuyers();
    }
  };

  const handleDelete = async () => {
    if (!buyerToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from('buyers').delete().eq('id', buyerToDelete.id);

    if (error) {
      alert(STRINGS.DELETE_ERROR + ': ' + error.message);
    } else {
      fetchBuyers();
    }
    setIsDeleting(false);
    setBuyerToDelete(null);
  };

  const getDeleteWarning = (buyer: Buyer): string => {
    const count = salesCount[buyer.id] || 0;
    if (count > 0) {
      return `${STRINGS.BUYER_HAS_SALES} (${count}). ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-6">{STRINGS.PAGE_BUYERS}</h1>

      <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
        <Input
          placeholder={STRINGS.BUYER_NAME_PLACEHOLDER}
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <Input
          placeholder={STRINGS.PHONE_PLACEHOLDER}
          value={newPhone}
          onChange={e => setNewPhone(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={loading || !newName} className="w-full">{STRINGS.ADD}</Button>
      </div>

      <div className="space-y-2">
        {buyers.map(b => {
          const isEditing = editingId === b.id;

          return (
            <div key={b.id} className="p-3 bg-white border rounded">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder={STRINGS.NAME_PLACEHOLDER}
                    className="!mb-2"
                  />
                  <Input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder={STRINGS.PHONE_PLACEHOLDER}
                    className="!mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(b.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.phone || '-'}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(b)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                      title={STRINGS.EDIT}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setBuyerToDelete(b)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title={STRINGS.DELETE}
                      disabled={salesCount[b.id] > 0}
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
        isOpen={!!buyerToDelete}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={buyerToDelete ? `${STRINGS.DELETE_BUYER_CONFIRM} "${buyerToDelete.name}"? ${getDeleteWarning(buyerToDelete)}` : ''}
        confirmLabel={STRINGS.DELETE}
        cancelLabel={STRINGS.CANCEL}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setBuyerToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
