/**
 * Utility function to clear all authentication data
 * Can be called from browser console: window.clearAuthSession()
 */
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from './logger';

export async function clearAuthSession() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    devError('Error signing out:', error);
  }
  
  // Clear all Supabase-related localStorage items
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    devLog('✅ LocalStorage cleared');
  } catch (error) {
    devError('Error clearing localStorage:', error);
  }
  
  // Clear sessionStorage as well
  try {
    sessionStorage.clear();
    devLog('✅ SessionStorage cleared');
  } catch (error) {
    devError('Error clearing sessionStorage:', error);
  }
  
  // Reload page
  window.location.href = '/';
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearAuthSession = clearAuthSession;
}

