export interface LeaderboardEntry {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  survivalRate: number;
  score: number;
  rank: string;
  avatar?: string;
  elo: number;
  level: number;
}

export interface TotalStats {
  totalGames: number;
  totalPlayers: number;
}

export interface PlayerStatsData {
  name: string;
  totalGames: number;
  totalWins: number;
  winRate: number;
  totalKills: number;
  totalSurvived: number;
  survivalRate: number;
  roleStats: Record<string, { games: number; wins: number }>;
  recentGames: {
    winner: string | null;
    role: string;
    team: string;
    survived: boolean;
    dayCount: number;
    startedAt: number;
  }[];
}

const API_BASE = import.meta.env.VITE_SOCKET_URL
  ? `${import.meta.env.VITE_SOCKET_URL}/api`
  : '/api';

export const API_ORIGIN = import.meta.env.VITE_SOCKET_URL || '';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchJson<LeaderboardEntry[]>('/stats/leaderboard');
}

export function getTotalStats(): Promise<TotalStats> {
  return fetchJson<{ totalGames: number; activeRooms: number; recentGames: unknown[]; topPlayers: LeaderboardEntry[] }>('/stats')
    .then(data => ({
      totalGames: data.totalGames,
      totalPlayers: data.topPlayers.reduce((sum, p) => sum + p.games, 0),
    }));
}

export function getPlayerStats(name: string): Promise<PlayerStatsData> {
  return fetchJson<PlayerStatsData>(`/stats/player/${encodeURIComponent(name)}`);
}
