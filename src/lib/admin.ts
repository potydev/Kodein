import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { devLog, devError, devWarn } from './logger';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  try {
    const result = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const { data, error } = result as { data: { role: string } | null; error: any };

    if (error || !data || !data.role) return false;
    return data.role === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * Get user role with timeout and better error handling
 */
export async function getUserRole(user: User | null): Promise<'user' | 'admin' | null> {
  if (!user) return null;

  try {
    // Try query with longer timeout and better error handling
    const queryResult = await Promise.race([
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle(),
      new Promise<{ data: null; error: { message: string; code?: string } }>((resolve) => {
        setTimeout(() => {
          devWarn('getUserRole query timeout after 5s');
          resolve({ data: null, error: { message: 'Query timeout', code: 'TIMEOUT' } });
        }, 5000); // Increased to 5 seconds
      })
    ]);

    const { data, error } = queryResult as { data: { role: string } | null; error: { message: string; code?: string } | null };

    // Handle error
    if (error) {
      devWarn('Error fetching role:', { code: error.code, message: error.message });
      // If column doesn't exist (migration not run), return 'user' as default
      if (error.code === 'PGRST116' || error.code === '42703' || error.message?.includes('role') || error.message?.includes('column')) {
        devWarn('Role column might not exist, defaulting to user');
        return 'user';
      }
      // For other errors, default to user
      return 'user';
    }

    // If no data, default to user
    if (!data) {
      devWarn('No profile data found, defaulting to user');
      return 'user';
    }

    // If role is null or undefined, default to user
    if (!data.role || data.role === null || data.role === undefined) {
      devWarn('Role is null/undefined, defaulting to user');
      return 'user';
    }
    
    devLog('Role fetched successfully:', data.role);
    return data.role as 'user' | 'admin';
  } catch (error) {
    // On any exception, default to user
    devError('Exception fetching user role:', error);
    return 'user';
  }
}

