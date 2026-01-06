'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { STRINGS } from '../lib/strings';
import { Loader2 } from 'lucide-react';

export default function Landing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/app');
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-green-700">
      <Loader2 className="animate-spin mr-2" />
      <span className="font-medium">{STRINGS.LOADING}</span>
    </div>
  );
}