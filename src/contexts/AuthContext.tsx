import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { validateUsername } from '@/utils/subscriptionUtils';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile as ProfileType } from '@/types/types';

interface AuthContextType {
  user: User | null;
  profile: ProfileType | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOfflineMode: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<ProfileType>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = session !== null;
  const isOfflineMode = session === null && !loading;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfileType>) => {
    if (!user) {
      throw new Error('Must be authenticated to update profile');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // Refresh local profile state
    await loadProfile(user.id);
  };

  const signIn = async (username: string, password: string) => {
    try {
      // If input looks like an email, use it directly, otherwise convert
      const email = username.includes('@') ? username : `${username}@modelmentor.app`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      // Validate username using shared utility
      if (!validateUsername(username)) {
        return { error: new Error('Username can only contain letters, digits, and underscore') };
      }

      // Convert username to email format
      const email = `${username}@modelmentor.app`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Create default subscription record (free tier) for the new user
      if (data.user) {
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: data.user.id,
            tier: 'free',
            status: 'active',
          });

        if (subError) {
          console.error('Error creating default subscription:', subError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, username?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error };
      }

      // Create default subscription record (free tier) for the new user
      if (data.user) {
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: data.user.id,
            tier: 'free',
            status: 'active',
          });

        if (subError) {
          console.error('Error creating default subscription:', subError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isOfflineMode,
    signIn,
    signUp,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
