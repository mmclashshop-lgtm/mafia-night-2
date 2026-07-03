import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AchievementId } from '@mafia/shared';
import { DEFAULT_ELO } from '@mafia/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const gamesFile = path.join(dataDir, 'games.json');
const profilesFile = path.join(dataDir, 'profiles.json');
const usersFile = path.join(dataDir, 'users.json');

// Write queue to prevent race conditions on file operations
const writeQueue: Array<() => void> = [];
let writing = false;

function processQueue(): void {
  if (writing || writeQueue.length === 0) return;
  writing = true;
  const task = writeQueue.shift();
  if (task) {
    try {
      task();
    } catch (err) {
      console.error('Write queue task failed:', err);
    }
  }
  writing = false;
  processQueue();
}

function enqueueWrite(fn: () => void): void {
  writeQueue.push(fn);
  if (!writing) processQueue();
}

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
  enqueueWrite(() => {
    const tmp = gamesFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(games, null, 2));
    fs.renameSync(tmp, gamesFile);
  });
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
  enqueueWrite(() => {
    const obj: Record<string, PlayerProfile> = {};
    for (const [key, val] of profiles) {
      obj[key] = val;
    }
    const tmp = profilesFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, profilesFile);
  });
}

function readUsers(): Map<string, StoredUser> {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf-8');
      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // File might be corrupted
  }
  return new Map();
}

function writeUsers(users: Map<string, StoredUser>): void {
  enqueueWrite(() => {
    const obj: Record<string, StoredUser> = {};
    for (const [key, val] of users) {
      obj[key] = val;
    }
    const tmp = usersFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, usersFile);
  });
}

export function initDatabase(): void {
  if (!fs.existsSync(gamesFile)) {
    writeGames([]);
  }
  if (!fs.existsSync(profilesFile)) {
    writeProfiles(new Map());
  }
  if (!fs.existsSync(usersFile)) {
    writeUsers(new Map());
  }
}

export function getOrCreateUser(userId: string, name: string): StoredUser {
  const users = readUsers();
  let user = users.get(userId);
  if (!user) {
    user = { userId, name, avatar: 'dicebear', createdAt: Date.now(), lastLoginAt: Date.now() };
    users.set(userId, user);
    writeUsers(users);
    getOrCreatePlayerProfile(userId, name);
  } else {
    user.lastLoginAt = Date.now();
    user.name = name;
    users.set(userId, user);
    writeUsers(users);
  }
  return user;
}

export function getUser(userId: string): StoredUser | null {
  const users = readUsers();
  return users.get(userId) ?? null;
}

export function getPlayerProfile(name: string): PlayerProfile | null {
  const profiles = readProfiles();
  const profile = profiles.get(name);
  return profile ? normalizePlayerProfile(profile, profile.userId ?? name, name) : null;
}

export function getPlayerProfileByUserId(userId: string): PlayerProfile | null {
  const profiles = readProfiles();
  for (const [, profile] of profiles) {
    if (profile.userId === userId) return normalizePlayerProfile(profile, userId, profile.name ?? userId);
  }
  return null;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  const profiles = readProfiles();
  profiles.set(profile.name, profile);
  writeProfiles(profiles);
}

function normalizePlayerProfile(profile: Partial<PlayerProfile>, userId: string, name: string): PlayerProfile {
  return {
    userId: profile.userId ?? userId,
    name: profile.name ?? name,
    totalGames: profile.totalGames ?? 0,
    totalWins: profile.totalWins ?? 0,
    totalKills: profile.totalKills ?? 0,
    totalSurvived: profile.totalSurvived ?? 0,
    score: profile.score ?? 0,
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    consecutiveWins: profile.consecutiveWins ?? 0,
    bestWinStreak: profile.bestWinStreak ?? 0,
    roleStats: profile.roleStats ?? {},
    recentGames: Array.isArray(profile.recentGames) ? profile.recentGames : [],
    elo: {
      casual: profile.elo?.['casual'] ?? DEFAULT_ELO,
      competitive: profile.elo?.['competitive'] ?? DEFAULT_ELO,
    },
    xp: profile.xp ?? 0,
    level: profile.level ?? 1,
    dailyQuests: Array.isArray(profile.dailyQuests) ? profile.dailyQuests : [],
    dailyQuestDate: profile.dailyQuestDate ?? '',
    friendUserIds: Array.isArray(profile.friendUserIds) ? profile.friendUserIds : [],
    pendingFriendRequests: Array.isArray(profile.pendingFriendRequests) ? profile.pendingFriendRequests : [],
  };
}

// Legacy support: create profile by name only
export function getOrCreatePlayerProfile(name: string): PlayerProfile;
export function getOrCreatePlayerProfile(userId: string, name: string): PlayerProfile;
export function getOrCreatePlayerProfile(first: string, second?: string): PlayerProfile {
  const userId = second ? first : 'legacy_';
  const name = second ?? first;
  const profiles = readProfiles();
  const existing = profiles.get(name);
  if (existing) {
    const normalized = normalizePlayerProfile(existing, userId, name);
    if (normalized.userId !== userId) {
      normalized.userId = userId;
    }
    profiles.set(name, normalized);
    writeProfiles(profiles);
    return normalized;
  }
  const profile: PlayerProfile = {
    userId,
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
    elo: { casual: DEFAULT_ELO, competitive: DEFAULT_ELO },
    xp: 0,
    level: 1,
    dailyQuests: [],
    dailyQuestDate: '',
    friendUserIds: [],
    pendingFriendRequests: [],
  };
  profiles.set(name, profile);
  writeProfiles(profiles);
  return profile;
}

export function sendFriendRequest(fromUserId: string, toUserId: string): boolean {
  const profiles = readProfiles();
  const fromProfile = getProfileByUserId(profiles, fromUserId);
  const toProfile = getProfileByUserId(profiles, toUserId);
  if (!fromProfile || !toProfile) return false;
  if (toProfile.pendingFriendRequests.includes(fromUserId)) return false;
  if (fromProfile.friendUserIds.includes(toUserId)) return false;
  toProfile.pendingFriendRequests.push(fromUserId);
  profiles.set(toProfile.name, toProfile);
  writeProfiles(profiles);
  return true;
}

export function acceptFriendRequest(userId: string, fromUserId: string): boolean {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  const fromProfile = getProfileByUserId(profiles, fromUserId);
  if (!userProfile || !fromProfile) return false;
  const idx = userProfile.pendingFriendRequests.indexOf(fromUserId);
  if (idx === -1) return false;
  userProfile.pendingFriendRequests.splice(idx, 1);
  if (!userProfile.friendUserIds.includes(fromUserId)) userProfile.friendUserIds.push(fromUserId);
  if (!fromProfile.friendUserIds.includes(userId)) fromProfile.friendUserIds.push(userId);
  profiles.set(userProfile.name, userProfile);
  profiles.set(fromProfile.name, fromProfile);
  writeProfiles(profiles);
  return true;
}

export function rejectFriendRequest(userId: string, fromUserId: string): boolean {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  if (!userProfile) return false;
  const idx = userProfile.pendingFriendRequests.indexOf(fromUserId);
  if (idx === -1) return false;
  userProfile.pendingFriendRequests.splice(idx, 1);
  profiles.set(userProfile.name, userProfile);
  writeProfiles(profiles);
  return true;
}

export function removeFriend(userId: string, targetUserId: string): boolean {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  const targetProfile = getProfileByUserId(profiles, targetUserId);
  if (!userProfile || !targetProfile) return false;
  const idx1 = userProfile.friendUserIds.indexOf(targetUserId);
  if (idx1 !== -1) userProfile.friendUserIds.splice(idx1, 1);
  const idx2 = targetProfile.friendUserIds.indexOf(userId);
  if (idx2 !== -1) targetProfile.friendUserIds.splice(idx2, 1);
  profiles.set(userProfile.name, userProfile);
  if (targetProfile.name !== userProfile.name) profiles.set(targetProfile.name, targetProfile);
  writeProfiles(profiles);
  return true;
}

export function getFriendProfiles(userId: string): { userId: string; name: string; avatar: string; elo: number; level: number }[] {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  if (!userProfile) return [];
  return userProfile.friendUserIds
    .map(fid => {
      const fp = getProfileByUserId(profiles, fid);
      if (!fp) return null;
      const user = getUser(fid);
      return { userId: fid, name: fp.name, avatar: user?.avatar ?? 'dicebear', elo: fp.elo['competitive'] ?? DEFAULT_ELO, level: fp.level };
    })
    .filter(Boolean) as { userId: string; name: string; avatar: string; elo: number; level: number }[];
}

function getProfileByUserId(profiles: Map<string, PlayerProfile>, userId: string): PlayerProfile | null {
  for (const [, profile] of profiles) {
    if (profile.userId === userId) return profile;
  }
  return null;
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
  elo: number;
  level: number;
  avatar?: string;
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
      const user = profile ? getUser(profile.userId) : null;
      return {
        name,
        games: data.games,
        wins: data.wins,
        winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
        kills: data.kills,
        survivalRate: data.games > 0 ? Math.round((data.survived / data.games) * 100) : 0,
        score: profile?.score ?? 0,
        rank: profile ? getRankLabel(profile.score) : 'Bronze',
        elo: profile?.elo?.['competitive'] ?? DEFAULT_ELO,
        level: profile?.level ?? 1,
        avatar: user?.avatar,
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
