'use client';
import React from 'react';
import { STRINGS } from '../../../../lib/strings';
import { WarehouseForm } from '../../../../components/forms/WarehouseForm';

export default function NewWarehousePage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">{STRINGS.ADD} {STRINGS.NAV_WAREHOUSES}</h1>
      <WarehouseForm mode="add" />
    </div>
  );
}
