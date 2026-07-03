import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { userId, name, avatar, profile, setAuth, updateProfile, logout, updateElo, updateXP, updateDailyQuests } = useAuthStore();

  const login = useCallback(async (newUserId: string, newName: string, newAvatar: string, newProfile: any) => {
    setAuth(newUserId, newName, newAvatar, newProfile);
  }, [setAuth]);

  const reconnect = useCallback(async (storedUserId: string, storedName: string, storedAvatar: string) => {
    try {
      const response = await fetch('/api/auth/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: storedUserId, name: storedName }),
      });
      if (!response.ok) {
        logout();
        return null;
      }
      const data = await response.json();
      setAuth(data.userId, data.name, data.avatar, data.profile);
      return data.profile;
    } catch {
      logout();
      return null;
    }
  }, [setAuth, logout]);

  const isAuthenticated = !!userId;

  return {
    userId,
    name,
    avatar,
    profile,
    login,
    reconnect,
    setAuth,
    updateProfile,
    logout,
    updateElo,
    updateXP,
    updateDailyQuests,
    isAuthenticated,
  };
}
