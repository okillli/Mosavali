'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { MobileNav } from '../../components/MobileNav';
import { STRINGS } from '../../lib/strings';
import { UserProvider } from '../../lib/contexts';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) return <div className="p-4 text-center">{STRINGS.LOADING}</div>;

  return (
    <UserProvider>
      <div className="pb-16 md:pb-0 md:flex">
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden md:flex flex-col w-64 bg-green-900 text-white h-screen sticky top-0 p-4">
          <h1 className="text-xl font-bold mb-8">{STRINGS.APP_NAME}</h1>
          <nav className="space-y-2">
            <Link href="/app" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_DASHBOARD}</Link>
            <Link href="/app/fields" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_FIELDS}</Link>
            <Link href="/app/works" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_WORKS}</Link>
            <Link href="/app/lots" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_LOTS}</Link>
            <Link href="/app/warehouses" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_WAREHOUSES}</Link>
            <Link href="/app/sales" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_SALES}</Link>
            <Link href="/app/expenses" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_EXPENSES}</Link>
            <Link href="/app/reports" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_REPORTS}</Link>
            <Link href="/app/settings" className="block py-2 px-4 rounded hover:bg-green-800">{STRINGS.NAV_SETTINGS}</Link>
          </nav>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="mt-auto py-2 px-4 bg-green-800 rounded hover:bg-green-700"
          >
            {STRINGS.LOGOUT}
          </button>
        </aside>

        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </UserProvider>
  );
}