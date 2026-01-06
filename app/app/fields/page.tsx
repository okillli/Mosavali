'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { STRINGS } from '../../../lib/strings';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Field } from '../../../types';

export default function FieldsList() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data } = await supabase.from('fields').select('*').order('created_at', { ascending: false });
    if (data) setFields(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{STRINGS.NAV_FIELDS}</h1>
        <Link href="/app/fields/new" className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium">
          <Plus size={16} className="mr-1" /> {STRINGS.ADD}
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <Link href={`/app/fields/${field.id}`} key={field.id} className="block bg-white p-4 rounded-lg shadow-sm border hover:border-green-500 transition-colors">
            <h3 className="font-bold text-lg mb-1">{field.name}</h3>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>{STRINGS.FIELD_AREA}: {field.area_ha} ჰა</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{field.ownership === 'OWNED' ? STRINGS.OWNED : STRINGS.RENTED}</span>
            </div>
            {field.location_text && <p className="text-xs text-gray-500 mt-2 truncate">{field.location_text}</p>}
          </Link>
        ))}
        {loading && (
          <div className="col-span-full text-center py-10 text-gray-500">იტვირთება...</div>
        )}
        {!loading && fields.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            მონაცემები არ მოიძებნა
          </div>
        )}
      </div>
    </div>
  );
}
