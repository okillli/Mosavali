'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { STRINGS } from '../../../../lib/strings';
import { Button, Input, ConfirmDialog } from '../../../../components/ui';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Season } from '../../../../types';

export default function SeasonsSettings() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [relatedCounts, setRelatedCounts] = useState<Record<string, number>>({});
  const [newYear, setNewYear] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editYear, setEditYear] = useState('');

  // Delete state
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchSeasons(); }, []);

  const fetchSeasons = async () => {
    const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false });
    if (data) {
      setSeasons(data);
      // Fetch related counts for each season (lots, works, expenses, sales)
      const counts: Record<string, number> = {};
      for (const season of data) {
        const [lotsRes, worksRes, expensesRes, salesRes] = await Promise.all([
          supabase.from('lots').select('*', { count: 'exact', head: true }).eq('season_id', season.id),
          supabase.from('works').select('*', { count: 'exact', head: true }).eq('season_id', season.id),
          supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('season_id', season.id),
          supabase.from('sales').select('*', { count: 'exact', head: true }).eq('season_id', season.id)
        ]);
        counts[season.id] = (lotsRes.count || 0) + (worksRes.count || 0) + (expensesRes.count || 0) + (salesRes.count || 0);
      }
      setRelatedCounts(counts);
    }
  };

  const handleAdd = async () => {
    if(!newYear) return;
    setLoading(true);

    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      alert(STRINGS.PROFILE_CHECK_DB);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('seasons').insert({
        farm_id: profile.farm_id,
        name: newYear.trim(),
        is_current: false
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      alert(STRINGS.ADD_SEASON_ERROR + ': ' + insertError.message);
    }

    setNewYear('');
    setLoading(false);
    fetchSeasons();
  };

  const setAsCurrent = async (id: string) => {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('farm_id').single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      alert(STRINGS.PROFILE_NOT_FOUND);
      return;
    }

    // Reset all seasons first
    const { error: resetError } = await supabase.from('seasons').update({ is_current: false }).eq('farm_id', profile.farm_id);
    if (resetError) {
      alert(STRINGS.SAVE_ERROR + ': ' + resetError.message);
      return;
    }

    // Set selected season as current
    const { error: setError } = await supabase.from('seasons').update({ is_current: true }).eq('id', id);
    if (setError) {
      alert(STRINGS.SAVE_ERROR + ': ' + setError.message);
      return;
    }

    fetchSeasons();
  };

  const startEdit = (season: Season) => {
    setEditingId(season.id);
    setEditYear(season.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditYear('');
  };

  const handleEdit = async (seasonId: string) => {
    if (!editYear.trim()) return;

    const { error } = await supabase.from('seasons').update({
      name: editYear.trim()
    }).eq('id', seasonId);

    if (error) {
      alert(STRINGS.SAVE_ERROR + ': ' + error.message);
    } else {
      setEditingId(null);
      fetchSeasons();
    }
  };

  const handleDelete = async () => {
    if (!seasonToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from('seasons').delete().eq('id', seasonToDelete.id);

    if (error) {
      alert(STRINGS.DELETE_ERROR + ': ' + error.message);
    } else {
      fetchSeasons();
    }
    setIsDeleting(false);
    setSeasonToDelete(null);
  };

  const getDeleteWarning = (season: Season): string => {
    const count = relatedCounts[season.id] || 0;
    if (count > 0) {
      return `${STRINGS.SEASON_HAS_RELATED_RECORDS} (${count}). ${STRINGS.DELETE_CANNOT_UNDO}`;
    }
    return STRINGS.DELETE_CANNOT_UNDO;
  };

  const canDelete = (season: Season): boolean => {
    // Cannot delete current season or seasons with related data
    return !season.is_current && (relatedCounts[season.id] || 0) === 0;
  };

  return (
    <div className="max-w-md">
       <h1 className="text-xl font-bold mb-6">{STRINGS.PAGE_SEASONS}</h1>

       <div className="flex gap-2 mb-6">
          <Input
            placeholder={STRINGS.SEASON_NAME_PLACEHOLDER}
            type="text"
            value={newYear}
            onChange={e => setNewYear(e.target.value)}
            noMargin
          />
          <Button onClick={handleAdd} disabled={loading}>{STRINGS.ADD}</Button>
       </div>

       <div className="bg-white rounded shadow divide-y">
           {seasons.map(s => {
             const isEditing = editingId === s.id;

             return (
               <div key={s.id} className="p-4">
                 {isEditing ? (
                   <div className="flex items-center gap-2">
                     <Input
                       type="text"
                       value={editYear}
                       onChange={e => setEditYear(e.target.value)}
                       noMargin
                       className="flex-1"
                     />
                     <button
                       onClick={() => handleEdit(s.id)}
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
                 ) : (
                   <div className="flex justify-between items-center">
                     <div className="font-bold text-lg">
                       {s.name}
                       {s.is_current && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{STRINGS.CURRENT_SEASON}</span>}
                     </div>
                     <div className="flex items-center gap-2">
                       {!s.is_current && (
                         <button onClick={() => setAsCurrent(s.id)} className="text-sm text-blue-600 hover:underline">
                           {STRINGS.SET_AS_CURRENT}
                         </button>
                       )}
                       {s.is_current && <Check className="text-green-600" size={20} />}
                       <button
                         onClick={() => startEdit(s)}
                         className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                         title={STRINGS.EDIT}
                       >
                         <Pencil size={16} />
                       </button>
                       <button
                         onClick={() => setSeasonToDelete(s)}
                         className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                         title={s.is_current ? STRINGS.CURRENT_SEASON_DELETE_DISABLED : STRINGS.DELETE}
                         disabled={!canDelete(s)}
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
         isOpen={!!seasonToDelete}
         title={STRINGS.DELETE_CONFIRM_TITLE}
         message={seasonToDelete ? `${STRINGS.DELETE_SEASON_CONFIRM} "${seasonToDelete.name}"? ${getDeleteWarning(seasonToDelete)}` : ''}
         confirmLabel={STRINGS.DELETE}
         cancelLabel={STRINGS.CANCEL}
         variant="danger"
         onConfirm={handleDelete}
         onCancel={() => setSeasonToDelete(null)}
         isLoading={isDeleting}
       />
    </div>
  );
}
