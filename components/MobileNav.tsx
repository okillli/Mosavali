import React from 'react';
import Link from 'next/link';
import { STRINGS } from '../lib/strings';
import { Home, Sprout, Package, ShoppingCart } from 'lucide-react';

export const MobileNav = React.memo(function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link href="/app" className="flex flex-col items-center text-gray-600 hover:text-green-600">
        <Home size={20} />
        <span className="text-[10px] mt-1">{STRINGS.NAV_DASHBOARD}</span>
      </Link>
      <Link href="/app/fields" className="flex flex-col items-center text-gray-600 hover:text-green-600">
        <Sprout size={20} />
        <span className="text-[10px] mt-1">{STRINGS.NAV_FIELDS}</span>
      </Link>
      <Link href="/app/lots" className="flex flex-col items-center text-gray-600 hover:text-green-600">
        <Package size={20} />
        <span className="text-[10px] mt-1">{STRINGS.NAV_LOTS}</span>
      </Link>
      <Link href="/app/sales" className="flex flex-col items-center text-gray-600 hover:text-green-600">
        <ShoppingCart size={20} />
        <span className="text-[10px] mt-1">{STRINGS.NAV_SALES}</span>
      </Link>
    </div>
  );
});
