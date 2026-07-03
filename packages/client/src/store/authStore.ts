import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

interface AuthState {
  userId: string | null;
  name: string | null;
  avatar: string | null;
  profile: PlayerProfile | null;
}

interface PlayerProfile {
  name: string;
  userId: string;
  totalGames: number;
  totalWins: number;
  totalKills: number;
  totalSurvived: number;
  score: number;
  achievements: string[];
  consecutiveWins: number;
  bestWinStreak: number;
  roleStats: Record<string, { games: number; wins: number }>;
  recentGames: Array<{
    winner: string | null;
    role: string;
    team: string;
    survived: boolean;
    dayCount: number;
    startedAt: number;
  }>;
  elo: { casual: number; competitive: number };
  xp: number;
  level: number;
  dailyQuests: unknown[];
  dailyQuestDate: string;
  friendUserIds: string[];
  pendingFriendRequests: string[];
}

interface AuthActions {
  setAuth: (userId: string, name: string, avatar: string, profile: PlayerProfile | null) => void;
  updateProfile: (profile: Partial<PlayerProfile>) => void;
  logout: () => void;
  updateElo: (mode: string, elo: number) => void;
  updateXP: (xp: number, level: number) => void;
  updateDailyQuests: (quests: unknown[]) => void;
}

const initialState: AuthState = {
  userId: null,
  name: null,
  avatar: null,
  profile: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set): AuthActions & AuthState => ({
        ...initialState,
        setAuth: (userId: string, name: string, avatar: string, profile: PlayerProfile | null) => {
          set({
            userId,
            name,
            avatar,
            profile,
          });
        },
        updateProfile: (updates: Partial<PlayerProfile>) => {
          set((state): AuthState => ({
            ...state,
            profile: state.profile ? { ...state.profile, ...updates } : null,
          }));
        },
        logout: () => {
          set(initialState);
        },
        updateElo: (mode: string, newElo: number) => {
          set((state): AuthState => ({
            ...state,
            profile: state.profile ? { ...state.profile, elo: { ...state.profile.elo, [mode]: newElo } } : null,
          }));
        },
        updateXP: (xp: number, level: number) => {
          set((state): AuthState => ({
            ...state,
            profile: state.profile ? { ...state.profile, xp, level } : null,
          }));
        },
        updateDailyQuests: (quests: unknown[]) => {
          set((state): AuthState => ({
            ...state,
            profile: state.profile ? { ...state.profile, dailyQuests: quests } : null,
          }));
        },
      }),
      {
        name: 'mafia-auth-storage',
        partialize: (state): Partial<AuthState> => {
          return {
            userId: state.userId,
            name: state.name,
            avatar: state.avatar,
          };
        },
      } as PersistOptions<AuthState & AuthActions>
    )
  )
);