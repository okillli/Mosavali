'use client';
import React from 'react';
import { STRINGS } from '../../../../lib/strings';
import { FieldForm } from '../../../../components/forms/FieldForm';

export default function NewFieldPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_FIELDS}</h1>
      <FieldForm mode="add" />
    </div>
  );
}
