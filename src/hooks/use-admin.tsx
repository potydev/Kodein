import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

/**
 * Hook to check if current user is admin
 */
export function useAdmin() {
  const { user, role } = useAuth();
  
  const isAdmin = useMemo(() => {
    return role === 'admin';
  }, [role]);

  return {
    isAdmin,
    role,
    user,
  };
}

