import fs from 'fs';
import { gamesFile } from './io';
import { readProfiles } from './profiles';
import { getUser } from './users';
import { DEFAULT_ELO } from '@mafia/shared';
import type { StoredGame, PlayerStatsResult, LeaderboardEntry } from './types';

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

function getRankLabel(score: number): string {
  if (score >= 3500) return 'Mafia Lord';
  if (score >= 2000) return 'Diamond';
  if (score >= 1000) return 'Platinum';
  if (score >= 500) return 'Gold';
  if (score >= 200) return 'Silver';
  return 'Bronze';
}

export function getPlayerStats(name: string): PlayerStatsResult | null {
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

export function getLeaderboard(limit = 20): LeaderboardEntry[] {
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
