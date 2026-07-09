export interface StoredPlayer {
  name: string;
  role: string;
  team: string;
  alive: boolean;
  survived: boolean;
  isBot: boolean;
  kills: number;
  daysSurvived: number;
}

export interface StoredGame {
  id: string;
  roomCode: string;
  startedAt: number;
  endedAt: number;
  winner: string | null;
  dayCount: number;
  playerCount: number;
  duration: number;
  rolePreset: string;
  mode: string;
  players: StoredPlayer[];
}

export interface DailyQuestProgress {
  id: string;
  current: number;
  completed: boolean;
}

export interface PlayerProfile {
  userId: string;
  name: string;
  totalGames: number;
  totalWins: number;
  totalKills: number;
  totalSurvived: number;
  score: number;
  consecutiveWins: number;
  bestWinStreak: number;
  roleStats: Record<string, { games: number; wins: number; saves?: number; investigations?: number; kills?: number }>;
  recentGames: Array<{
    winner: string | null;
    role: string;
    team: string;
    survived: boolean;
    dayCount: number;
    startedAt: number;
  }>;
  achievements: string[];
  coins: number;
  inventory: string[];
  elo: Record<string, number>;
  xp: number;
  level: number;
  dailyQuests: DailyQuestProgress[];
  dailyQuestDate: string;
  friendUserIds: string[];
  pendingFriendRequests: string[];
}

export interface StoredUser {
  userId: string;
  name: string;
  avatar: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface FriendProfile {
  userId: string;
  name: string;
  avatar: string;
  elo: number;
  level: number;
}

export interface LeaderboardEntry {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  survivalRate: number;
  score: number;
  rank: string;
  elo: number;
  level: number;
  avatar?: string;
}

export interface PlayerStatsResult {
  name: string;
  totalGames: number;
  totalWins: number;
  winRate: number;
  totalKills: number;
  totalSurvived: number;
  survivalRate: number;
  roleStats: Record<string, { games: number; wins: number }>;
  recentGames: Array<{
    winner: string | null;
    role: string;
    team: string;
    survived: boolean;
    dayCount: number;
    startedAt: number;
  }>;
}
