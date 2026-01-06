'use client';
import React from 'react';
import Link from 'next/link';
import { STRINGS } from '../../../lib/strings';
import { ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const settingsLinks = [
      { name: STRINGS.PAGE_INITIAL_SETUP, href: '/app/settings/initial-setup' },
      { name: 'სეზონები', href: '/app/settings/seasons' },
      { name: 'ჯიშები', href: '/app/settings/varieties' },
      { name: 'სამუშაოს ტიპები', href: '/app/settings/work-types' },
      { name: 'მყიდველები', href: '/app/settings/buyers' },
      { name: 'საწყობები', href: '/app/warehouses' }, // Reusing main link
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{STRINGS.NAV_SETTINGS}</h1>
      <div className="bg-white rounded-lg shadow divide-y">
          {settingsLinks.map((link) => (
              <Link href={link.href} key={link.href} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-700">{link.name}</span>
                  <ChevronRight size={18} className="text-gray-400" />
              </Link>
          ))}
      </div>
      <div className="mt-8 text-center text-sm text-gray-400">
          ვერსია 1.0.0
      </div>
    </div>
  );
}
