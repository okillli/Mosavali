import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { STRINGS } from '../lib/strings';
import {
  Home,
  Sprout,
  Package,
  ShoppingCart,
  MoreHorizontal,
  Tractor,
  Warehouse,
  Receipt,
  BarChart3,
  Settings,
  X,
  LucideIcon
} from 'lucide-react';

// Helper component for main nav items
function NavItem({ href, icon: Icon, label, active }: { href: string; icon: LucideIcon; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center py-1 px-3 min-h-[44px] ${active ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1">{label}</span>
    </Link>
  );
}

// Helper component for more menu items
function MoreMenuItem({ href, icon: Icon, label, onClick }: { href: string; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg"
    >
      <Icon size={20} className="text-gray-600" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export const MobileNav = React.memo(function MobileNav() {
  const [showMore, setShowMore] = useState(false);
  const [pathname, setPathname] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onHashChange = () => setPathname(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50 md:hidden">
        <NavItem href="/app" icon={Home} label={STRINGS.NAV_DASHBOARD} active={pathname === '/app'} />
        <NavItem href="/app/fields" icon={Sprout} label={STRINGS.NAV_FIELDS} active={isActive('/app/fields')} />
        <NavItem href="/app/lots" icon={Package} label={STRINGS.NAV_LOTS} active={isActive('/app/lots')} />
        <NavItem href="/app/sales" icon={ShoppingCart} label={STRINGS.NAV_SALES} active={isActive('/app/sales')} />
        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center text-gray-600 hover:text-green-600 py-1 px-3 min-h-[44px]"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] mt-1">{STRINGS.NAV_MORE}</span>
        </button>
      </div>

      {/* More Menu Bottom Sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMore(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">{STRINGS.NAV_MORE}</h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-2 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <MoreMenuItem href="/app/works" icon={Tractor} label={STRINGS.NAV_WORKS} onClick={() => setShowMore(false)} />
              <MoreMenuItem href="/app/warehouses" icon={Warehouse} label={STRINGS.NAV_WAREHOUSES} onClick={() => setShowMore(false)} />
              <MoreMenuItem href="/app/expenses" icon={Receipt} label={STRINGS.NAV_EXPENSES} onClick={() => setShowMore(false)} />
              <MoreMenuItem href="/app/reports" icon={BarChart3} label={STRINGS.NAV_REPORTS} onClick={() => setShowMore(false)} />
              <MoreMenuItem href="/app/settings" icon={Settings} label={STRINGS.NAV_SETTINGS} onClick={() => setShowMore(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});
