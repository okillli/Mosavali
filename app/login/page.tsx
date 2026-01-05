'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { STRINGS } from '../../lib/strings';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // Cast auth to any to support both v1 and v2 types
      const { data: { session } } = await (supabase.auth as any).getSession();
      if (session) {
        router.replace('/app'); // Redirect if already logged in
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignUp) {
      // Cast auth to any to support both v1 and v2 types
      const { error } = await (supabase.auth as any).signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('რეგისტრაცია წარმატებულია! გთხოვთ გაიაროთ ავტორიზაცია.');
        setIsSignUp(false);
      }
    } else {
      // Cast auth to any to support both v1 and v2 types
      const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
      if (error) {
        setError(STRINGS.AUTH_ERROR);
      } else {
        router.push('/app');
      }
    }
  };

  if (loading) return null; // Prevent flash of login form

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-700">{STRINGS.APP_NAME}</h1>
        <h2 className="text-lg font-semibold mb-4 text-center">
            {isSignUp ? 'რეგისტრაცია' : STRINGS.LOGIN_TITLE}
        </h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-sm">{message}</div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.EMAIL}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.PASSWORD}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded p-2"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
          >
            {isSignUp ? 'რეგისტრაცია' : STRINGS.LOGIN_BUTTON}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-green-600 hover:underline"
            >
                {isSignUp ? 'უკვე გაქვთ ანგარიში? შესვლა' : 'ახალი ხართ? დარეგისტრირდით'}
            </button>
        </div>
      </div>
    </div>
  );
}