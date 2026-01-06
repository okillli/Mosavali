'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button, Input, ConfirmDialog } from '../../../../components/ui';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { WorkType } from '../../../../types';

export default function WorkTypesSettings() {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [worksCount, setWorksCount] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete state
  const [workTypeToDelete, setWorkTypeToDelete] = useState<WorkType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFarmId();
  }, []);

  useEffect(() => {
    if (farmId) {
      fetchWorkTypes();
    }
  }, [farmId]);

  const fetchFarmId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('farm_id')
        .eq('id', user.id)
        .single();
      if (profile) {
        setFarmId(profile.farm_id);
      }
    }
  };

  const fetchWorkTypes = async () => {
    const [workTypesRes, worksRes] = await Promise.all([
      supabase.from('work_types')
        .select('*')
        .order('name')
        .limit(100),
      supabase.from('works')
        .select('work_type_id')
    ]);

    if (workTypesRes.data) {
      setWorkTypes(workTypesRes.data);

      // Calculate counts client-side
      const counts: Record<string, number> = {};
      workTypesRes.data.forEach(wt => {
        counts[wt.id] = 0;
      });

      if (worksRes.data) {
        worksRes.data.forEach(work => {
          if (counts[work.work_type_id] !== undefined) {
            counts[work.work_type_id]++;
          }
        });
      }
      setWorksCount(counts);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !farmId) return;
    setLoading(true);

    const { error } = await supabase.from('work_types').insert({
      name: newName.trim(),
      farm_id: farmId
    });

    if (error) {
      console.error('Insert error:', error);
      alert(STRINGS.ADD_WORK_TYPE_ERROR + ': ' + error.message);
    }

    setNewName('');
    setLoading(false);
    fetchWorkTypes();
  };

  const startEdit = (workType: WorkType) => {
    setEditingId(workType.id);
    setEditName(workType.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleEdit = async (workTypeId: string) => {
    if (!editName.trim()) return;

    const { error } = await supabase.from('work_types').update({
      name: editName.trim()
    }).eq('id', workTypeId);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
    } else {
      setEditingId(null);
      fetchWorkTypes();
    }
  };

  const handleDelete = async () => {
    if (!workTypeToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from('work_types').delete().eq('id', workTypeToDelete.id);

    if (error) {
      alert(STRINGS.DELETE_ERROR + ': ' + error.message);
    } else {
      fetchWorkTypes();
    }
    setIsDeleting(false);
    setWorkTypeToDelete(null);
  };

  const getDeleteWarning = (workType: WorkType): string => {
    const count = worksCount[workType.id] || 0;
    if (count > 0) {
      return `${STRINGS.WORK_TYPE_HAS_WORKS} (${count}). ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-6">{STRINGS.PAGE_WORK_TYPES}</h1>

      <div className="bg-white p-4 rounded shadow mb-6 space-y-3">
        <Input
          placeholder={STRINGS.WORK_TYPE_NAME_PLACEHOLDER}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={loading || !newName.trim()} className="w-full">
          {STRINGS.ADD}
        </Button>
      </div>

      <div className="space-y-2">
        {workTypes.map(wt => {
          const isEditing = editingId === wt.id;
          const hasWorks = (worksCount[wt.id] || 0) > 0;

          return (
            <div key={wt.id} className="p-3 bg-white border rounded">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder={STRINGS.WORK_TYPE_NAME_PLACEHOLDER}
                    className="!mb-2"
                    onKeyDown={e => e.key === 'Enter' && handleEdit(wt.id)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(wt.id)}
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
                    <span className="font-bold">{wt.name}</span>
                    {hasWorks && (
                      <span className="text-xs text-gray-400 ml-2">
                        ({worksCount[wt.id]} {STRINGS.NAV_WORKS.toLowerCase()})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(wt)}
                      className="p-3 text-gray-500 hover:bg-gray-100 rounded"
                      title={STRINGS.EDIT}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setWorkTypeToDelete(wt)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      title={STRINGS.DELETE}
                      disabled={hasWorks}
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
        isOpen={!!workTypeToDelete}
        title={STRINGS.DELETE_CONFIRM_TITLE}
        message={workTypeToDelete ? `${STRINGS.DELETE_WORK_TYPE_CONFIRM} "${workTypeToDelete.name}"? ${getDeleteWarning(workTypeToDelete)}` : ''}
        confirmLabel={STRINGS.DELETE}
        cancelLabel={STRINGS.CANCEL}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setWorkTypeToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
