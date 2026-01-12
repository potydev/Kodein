import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserRole } from '@/lib/admin';
import { devLog, devError, devWarn } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: 'user' | 'admin' | null;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async (user: User | null) => {
      if (!user) {
        if (mounted) {
          setRole(null);
        }
        return;
      }
      try {
        const userRole = await getUserRole(user);
        // Ensure we always set a valid role (never undefined)
        const validRole = userRole === null || userRole === undefined ? 'user' : userRole;
        if (mounted) {
          devLog('Setting role:', validRole);
          setRole(validRole);
        }
      } catch (error) {
        devError('Error fetching user role:', error);
        if (mounted) {
          setRole('user'); // Default to user on error
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // If session is null (signed out), clear everything
        if (!session) {
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        // Set session and user immediately to prevent loading state
        setSession(session);
        setUser(session?.user ?? null);
        
        // Always set loading to false first, then fetch role in background
        setLoading(false);
        
        // Fetch role in background, but don't block on it
        if (session?.user) {
          fetchUserRole(session.user).catch((err) => {
            devError('Error in fetchUserRole (auth change):', err);
            if (mounted) {
              setRole('user');
            }
          });
        }
      }
    );

    // Set a timeout to ensure loading doesn't hang forever
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        devWarn('Loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(loadingTimeout);
      if (!mounted) return;
      
      if (error) {
        devError('Error getting session:', error);
        // If session error, clear invalid session
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      
      // Set session and user immediately
      setSession(session);
      setUser(session?.user ?? null);
      
      // Always set loading to false first
      setLoading(false);
      
      // Fetch role in background (non-blocking)
      if (session?.user) {
        fetchUserRole(session.user).catch((err) => {
          devError('Error in fetchUserRole:', err);
          if (mounted) {
            setRole('user');
          }
        });
      } else {
        // No session, no user
        setRole(null);
      }
    }).catch((error) => {
      clearTimeout(loadingTimeout);
      if (mounted) {
        devError('Error in getSession:', error);
        // On error, clear session and stop loading
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          full_name: username,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  };

  const clearSession = async () => {
    // Force clear all auth data
    try {
      await supabase.auth.signOut();
    } catch (error) {
      devError('Error signing out:', error);
    }
    
    // Clear localStorage manually
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      devError('Error clearing localStorage:', error);
    }
    
    // Reset state
    setSession(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signUp, signIn, signOut, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
