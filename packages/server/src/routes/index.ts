import { Router } from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { roomStore } from '../rooms/store';
import {
  getTotalGames,
  getRecentGames,
  getLeaderboard,
  getPlayerStats,
  getPlayerProfile,
  getPlayerProfileByUserId,
  getFriendProfiles,
  getPlayerInventory,
  getPlayerCoins,
  buyItem,
} from '../db';
import { getRank, SHOP_ITEMS } from '@mafia/shared';
import { loadSiteConfig, saveSiteConfig, saveUploadedFile, getAdminToken } from '../siteConfig';

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
    achievements: profile?.achievements ?? [],
    coins: profile?.coins ?? 0,
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

// Store: list all items
router.get('/store/items', (_req, res) => {
  res.json(SHOP_ITEMS);
});

// Store: get player inventory + coins
router.get('/store/inventory/:userId', (req, res) => {
  const inventory = getPlayerInventory(req.params.userId);
  const coins = getPlayerCoins(req.params.userId);
  res.json({ inventory, coins });
});

// Store: buy item
router.post('/store/buy', (req, res) => {
  const { userId, itemId } = req.body;
  if (!userId || !itemId) {
    res.status(400).json({ success: false, error: 'Missing userId or itemId' });
    return;
  }
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    res.status(404).json({ success: false, error: 'Item not found' });
    return;
  }
  const result = buyItem(userId, itemId, item.price);
  if (result.success) {
    const coins = getPlayerCoins(userId);
    res.json({ success: true, coins });
  } else {
    res.status(400).json(result);
  }
});

// Site config (persistent admin settings)
router.get('/config', (_req, res) => {
  res.json(loadSiteConfig());
});

router.post('/config', (req, res) => {
  const saved = saveSiteConfig(req.body);
  res.json({ success: true, config: saved });
  const root = path.resolve(fileURLToPath(import.meta.url), '../../../..');
  exec(`git add packages/config.json && git commit --no-verify -m "تحديث الإعدادات من لوحة التحكم" && git push origin master`, { cwd: root, timeout: 30000 }, () => {});
});

// Upload file (base64)
router.post('/upload', (req, res) => {
  const { file, name } = req.body;
  if (!file || !name) {
    res.status(400).json({ error: 'Missing file or name' });
    return;
  }
  try {
    const relUrl = saveUploadedFile(file, name);
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['host'] || 'localhost:3001';
    const fullUrl = `${proto}://${host}${relUrl}`;
    res.json({ success: true, url: fullUrl });
  } catch {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Admin token info (returns token for local dev debugging)
router.get('/admin/token', (req, res) => {
  const token = getAdminToken();
  const host = req.headers['host'] || '';
  res.json({
    token: (host.includes('localhost') || host.includes('127.0.0.1')) ? token : null
  });
});

// Verify admin token
router.post('/admin/verify', (req, res) => {
  const { token } = req.body;
  const actual = getAdminToken();
  res.json({ valid: token === actual });
});

export { router as apiRoutes };
