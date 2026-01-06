'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../../lib/supabaseClient';
import { STRINGS } from '../../../../../lib/strings';
import { FieldForm } from '../../../../../components/forms/FieldForm';
import { Field } from '../../../../../types';

export default function EditFieldPage() {
  const { id } = useParams();
  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchField();
    }
  }, [id]);

  const fetchField = async () => {
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      alert(STRINGS.LOAD_ERROR);
    } else {
      setField(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-4">{STRINGS.LOADING}</div>;
  }

  if (!field) {
    return <div className="p-4">{STRINGS.FIELD_NOT_FOUND}</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.EDIT} - {field.name}</h1>
      <FieldForm mode="edit" initialData={field} />
    </div>
  );
}
