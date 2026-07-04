import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { name, setName, logout } = useAuthStore();

  const isAuthenticated = !!name;

  return {
    name,
    setName,
    logout,
    isAuthenticated,
  };
}
