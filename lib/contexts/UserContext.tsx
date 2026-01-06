import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Profile } from '../../types';

interface UserContextValue {
  profile: Profile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
