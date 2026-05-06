import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkWhitelist(session?.user);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkWhitelist(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkWhitelist = async (currentUser: User | null | undefined) => {
    if (!currentUser) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    const discordId = currentUser.user_metadata?.provider_id;
    if (!discordId) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('allowed_users')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (data && !error) {
      setIsAllowed(true);
    } else {
      setIsAllowed(false);
    }
    setLoading(false);
  };

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { user, isAllowed, loading, login, logout };
}
