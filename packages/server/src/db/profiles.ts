import fs from 'fs';
import { profilesFile, enqueueWrite } from './io';
import { DEFAULT_ELO } from '@mafia/shared';
import type { PlayerProfile } from './types';

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

function normalizePlayerProfile(profile: Partial<PlayerProfile>, userId: string, name: string): PlayerProfile {
  return {
    userId: profile.userId ?? userId,
    name: profile.name ?? name,
    totalGames: profile.totalGames ?? 0,
    totalWins: profile.totalWins ?? 0,
    totalKills: profile.totalKills ?? 0,
    totalSurvived: profile.totalSurvived ?? 0,
    score: profile.score ?? 0,
    consecutiveWins: profile.consecutiveWins ?? 0,
    bestWinStreak: profile.bestWinStreak ?? 0,
    roleStats: profile.roleStats ?? {},
    recentGames: Array.isArray(profile.recentGames) ? profile.recentGames : [],
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    coins: profile.coins ?? 0,
    inventory: Array.isArray(profile.inventory) ? profile.inventory : [],
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

function getProfileByUserId(profiles: Map<string, PlayerProfile>, userId: string): PlayerProfile | null {
  for (const [, profile] of profiles) {
    if (profile.userId === userId) return profile;
  }
  return null;
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
    consecutiveWins: 0,
    bestWinStreak: 0,
    roleStats: {},
    recentGames: [],
    achievements: [],
    coins: 0,
    inventory: [],
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

export { getProfileByUserId, readProfiles, writeProfiles };
