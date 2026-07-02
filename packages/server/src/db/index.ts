import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AchievementId } from '@mafia/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const gamesFile = path.join(dataDir, 'games.json');
const profilesFile = path.join(dataDir, 'profiles.json');

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
  players: StoredPlayer[];
}

export interface PlayerProfile {
  name: string;
  totalGames: number;
  totalWins: number;
  totalKills: number;
  totalSurvived: number;
  score: number;
  achievements: AchievementId[];
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
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readGames(): StoredGame[] {
  try {
    if (fs.existsSync(gamesFile)) {
      const data = fs.readFileSync(gamesFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // File might be corrupted
  }
  return [];
}

function writeGames(games: StoredGame[]): void {
  fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
}

function readProfiles(): Map<string, PlayerProfile> {
  try {
    if (fs.existsSync(profilesFile)) {
      const data = fs.readFileSync(profilesFile, 'utf-8');
      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // File might be corrupted
  }
  return new Map();
}

function writeProfiles(profiles: Map<string, PlayerProfile>): void {
  const obj: Record<string, PlayerProfile> = {};
  for (const [key, val] of profiles) {
    obj[key] = val;
  }
  fs.writeFileSync(profilesFile, JSON.stringify(obj, null, 2));
}

export function initDatabase(): void {
  if (!fs.existsSync(gamesFile)) {
    writeGames([]);
  }
  if (!fs.existsSync(profilesFile)) {
    writeProfiles(new Map());
  }
}

export function getPlayerProfile(name: string): PlayerProfile | null {
  const profiles = readProfiles();
  return profiles.get(name) ?? null;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  const profiles = readProfiles();
  profiles.set(profile.name, profile);
  writeProfiles(profiles);
}

export function getOrCreatePlayerProfile(name: string): PlayerProfile {
  const existing = getPlayerProfile(name);
  if (existing) return existing;
  const profile: PlayerProfile = {
    name,
    totalGames: 0,
    totalWins: 0,
    totalKills: 0,
    totalSurvived: 0,
    score: 0,
    achievements: [],
    consecutiveWins: 0,
    bestWinStreak: 0,
    roleStats: {},
    recentGames: [],
  };
  savePlayerProfile(profile);
  return profile;
}

export function saveGame(gameData: StoredGame): void {
  const games = readGames();
  games.push(gameData);
  writeGames(games);
}

export function getTotalGames(): number {
  return readGames().length;
}

export function getRecentGames(limit = 10): StoredGame[] {
  return readGames()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit);
}

export function getPlayerStats(name: string) {
  const games = readGames();
  const playerGames = games.filter(g => g.players.some(p => p.name === name));
  const totalGames = playerGames.length;
  if (totalGames === 0) return null;

  let totalWins = 0;
  const roleStats: Record<string, { games: number; wins: number }> = {};
  let totalKills = 0;
  let totalSurvived = 0;

  for (const game of playerGames) {
    const player = game.players.find(p => p.name === name);
    if (!player) continue;

    if (player.team === game.winner) totalWins++;
    const existing = roleStats[player.role] ?? { games: 0, wins: 0 };
    existing.games++;
    if (player.team === game.winner) existing.wins++;
    roleStats[player.role] = existing;
    totalKills += player.kills;
    if (player.survived) totalSurvived++;
  }

  return {
    name,
    totalGames,
    totalWins,
    winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
    totalKills,
    totalSurvived,
    survivalRate: totalGames > 0 ? Math.round((totalSurvived / totalGames) * 100) : 0,
    roleStats,
    recentGames: playerGames.slice(-5).map(g => ({
      winner: g.winner,
      role: g.players.find(p => p.name === name)?.role ?? '',
      team: g.players.find(p => p.name === name)?.team ?? '',
      survived: g.players.find(p => p.name === name)?.survived ?? false,
      dayCount: g.dayCount,
      startedAt: g.startedAt,
    })),
  };
}

export function getLeaderboard(limit = 20): {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  survivalRate: number;
  score: number;
  rank: string;
}[] {
  const games = readGames();
  const stats = new Map<string, { games: number; wins: number; kills: number; survived: number }>();
  const profiles = readProfiles();

  for (const game of games) {
    for (const player of game.players) {
      if (player.isBot) continue;
      const existing = stats.get(player.name) ?? { games: 0, wins: 0, kills: 0, survived: 0 };
      existing.games++;
      if (player.team === game.winner) existing.wins++;
      existing.kills += player.kills;
      if (player.survived) existing.survived++;
      stats.set(player.name, existing);
    }
  }

  return Array.from(stats.entries())
    .map(([name, data]) => {
      const profile = profiles.get(name);
      return {
        name,
        games: data.games,
        wins: data.wins,
        winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
        kills: data.kills,
        survivalRate: data.games > 0 ? Math.round((data.survived / data.games) * 100) : 0,
        score: profile?.score ?? 0,
        rank: profile ? getRankLabel(profile.score) : 'Bronze',
      };
    })
    .sort((a, b) => b.score - a.score || b.games - a.games)
    .slice(0, limit);
}

function getRankLabel(score: number): string {
  if (score >= 3500) return 'Mafia Lord';
  if (score >= 2000) return 'Diamond';
  if (score >= 1000) return 'Platinum';
  if (score >= 500) return 'Gold';
  if (score >= 200) return 'Silver';
  return 'Bronze';
}
