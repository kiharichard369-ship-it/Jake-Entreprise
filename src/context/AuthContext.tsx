import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, UserRole } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  businessId: string | null;
  shopId: string | null;
  isLoading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[AuthContext] fetchProfile error:', error.message, error.code);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                 = useState<User | null>(null);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = async (u: User) => {
    setProfileError(null);
    const p = await fetchProfile(u.id);
    if (!p) {
      setProfileError(
        `No profile found for this account. ` +
        `Ask your administrator to create a profile row for user ID: ${u.id}`
      );
    }
    setProfile(p);
  };

  useEffect(() => {
    let mounted = true;

    // ── FIX: getSession() first, then subscribe ──────────────────────────
    // onAuthStateChange alone does NOT reliably fire INITIAL_SESSION when
    // there is no stored session — getSession() guarantees the spinner
    // always resolves, even when the user is completely logged out.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user);
      }

      // Always stop the spinner after getSession resolves
      if (mounted) setIsLoading(false);
    });

    // ── Listener handles changes AFTER initial load ───────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setProfile(null);
          setProfileError(null);
          // Don't touch isLoading here — getSession already handled it
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user);
          await loadProfile(session.user);
          if (mounted) setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { error };
    }
    if (data.user) setUser(data.user);
    // onAuthStateChange SIGNED_IN will fire and set isLoading=false
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setProfileError(null);
  };

  const refetchProfile = async () => {
    if (!user) return;
    setProfileError(null);
    const p = await fetchProfile(user.id);
    setProfile(p);
    if (!p) setProfileError('Profile not found. Contact your administrator.');
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role:       profile?.role       ?? null,
      businessId: profile?.business_id ?? null,
      shopId:     profile?.shop_id     ?? null,
      isLoading,
      profileError,
      signIn,
      signOut,
      refetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}