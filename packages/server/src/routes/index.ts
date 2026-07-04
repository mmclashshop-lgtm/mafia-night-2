import { Router } from 'express';
import { roomStore } from '../rooms/store';
import {
  getTotalGames,
  getRecentGames,
  getLeaderboard,
  getPlayerStats,
  getPlayerProfile,
  getPlayerProfileByUserId,
  getFriendProfiles,
} from '../db';
import { getRank } from '@mafia/shared';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    rooms: roomStore.size,
    timestamp: Date.now(),
  });
});

router.get('/stats', (_req, res) => {
  const totalGames = getTotalGames();
  const recentGames = getRecentGames(5);
  const leaderboard = getLeaderboard(10);

  res.json({
    totalGames,
    activeRooms: roomStore.size,
    recentGames: recentGames.map(g => ({
      id: g.id,
      winner: g.winner,
      dayCount: g.dayCount,
      playerCount: g.playerCount,
      endedAt: g.endedAt,
      players: g.players.map(p => ({ name: p.name, role: p.role, team: p.team, alive: p.alive })),
    })),
    topPlayers: leaderboard,
  });
});

router.get('/stats/leaderboard', (_req, res) => {
  res.json(getLeaderboard());
});

router.get('/stats/player/:name', (req, res) => {
  const stats = getPlayerStats(req.params.name);
  if (!stats) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  const profile = getPlayerProfile(req.params.name);
  res.json({
    ...stats,
    score: profile?.score ?? 0,
    rank: profile ? getRank(profile.score).name : 'Bronze',
    rankIcon: profile ? getRank(profile.score).icon : '🥉',
    bestWinStreak: profile?.bestWinStreak ?? 0,
    elo: profile?.elo ?? { casual: 1000, competitive: 1000 },
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
    userId: profile?.userId ?? '',
  });
});

router.get('/games/recent', (req, res) => {
  const limit = Math.min(parseInt((req.query['limit'] as string) || '20') || 20, 100);
  const games = getRecentGames(limit);
  res.json(games);
});

// Friend list
router.get('/friends/:userId', (req, res) => {
  const friends = getFriendProfiles(req.params.userId);
  res.json(friends);
});

// Profile by userId
router.get('/profile/:userId', (req, res) => {
  const profile = getPlayerProfileByUserId(req.params.userId);
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json(profile);
});

export { router as apiRoutes };
