export const XP_PER_GAME = 50;
export const XP_PER_WIN = 100;
export const XP_PER_KILL = 25;
export const XP_PER_SURVIVAL = 10;
export const XP_PER_DAILY_QUEST = 75;

export const MAX_LEVEL = 100;

const LEVEL_THRESHOLDS: number[] = [];
for (let i = 0; i < MAX_LEVEL; i++) {
  LEVEL_THRESHOLDS.push(200 * (i + 1) + i * 50);
}

export function getLevelThreshold(level: number): number {
  if (level < 1) return 0;
  if (level > MAX_LEVEL) level = MAX_LEVEL;
  const idx = level - 1;
  const val = LEVEL_THRESHOLDS[idx];
  return val !== undefined ? val : 0;
}

export function getLevel(xp: number): number {
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    const val = LEVEL_THRESHOLDS[i];
    if (val !== undefined && xp < val) return i + 1;
  }
  return MAX_LEVEL;
}

export function getXPForLevel(level: number): number {
  const idx = Math.min(Math.max(0, level - 1), MAX_LEVEL - 1);
  const val = LEVEL_THRESHOLDS[idx];
  return val !== undefined ? val : 0;
}

export function getLevelProgress(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  const level = getLevel(xp);
  const currentThreshold = level > 0 ? (LEVEL_THRESHOLDS[level - 1] ?? 0) : 0;
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(level, MAX_LEVEL - 1)] ?? 0;
  const currentXP = xp - currentThreshold;
  const nextLevelXP = nextThreshold - currentThreshold;
  const progress = nextLevelXP > 0 ? Math.min(1, currentXP / nextLevelXP) : 1;
  return { level, currentXP, nextLevelXP, progress };
}

export interface DailyQuest {
  id: string;
  description: string;
  icon: string;
  requirement: number;
  reward: number;
  type: 'play_games' | 'wins' | 'kills' | 'survive' | 'mafia_win' | 'town_win' | 'votes_cast';
}

export const DAILY_QUESTS_POOL: DailyQuest[] = [
  { id: 'play_3', description: 'Play 3 games', icon: '🎮', requirement: 3, reward: XP_PER_DAILY_QUEST, type: 'play_games' },
  { id: 'play_5', description: 'Play 5 games', icon: '🎯', requirement: 5, reward: XP_PER_DAILY_QUEST * 2, type: 'play_games' },
  { id: 'win_1', description: 'Win 1 game', icon: '🏆', requirement: 1, reward: XP_PER_DAILY_QUEST, type: 'wins' },
  { id: 'win_2', description: 'Win 2 games', icon: '🏅', requirement: 2, reward: XP_PER_DAILY_QUEST * 2, type: 'wins' },
  { id: 'kill_3', description: 'Get 3 kills', icon: '💀', requirement: 3, reward: XP_PER_DAILY_QUEST, type: 'kills' },
  { id: 'survive_2', description: 'Survive 2 games', icon: '🛡️', requirement: 2, reward: XP_PER_DAILY_QUEST, type: 'survive' },
  { id: 'mafia_win', description: 'Win as Mafia', icon: '🎭', requirement: 1, reward: XP_PER_DAILY_QUEST * 2, type: 'mafia_win' },
  { id: 'town_win', description: 'Win as Town', icon: '🏘️', requirement: 1, reward: XP_PER_DAILY_QUEST, type: 'town_win' },
  { id: 'vote_5', description: 'Cast 5 votes', icon: '🗳️', requirement: 5, reward: XP_PER_DAILY_QUEST, type: 'votes_cast' },
];

export function pickDailyQuests(count = 3): DailyQuest[] {
  const shuffled = [...DAILY_QUESTS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function calculateGameXP(stats: { won: boolean; kills: number; survived: boolean }): number {
  let xp = XP_PER_GAME;
  if (stats.won) xp += XP_PER_WIN;
  xp += stats.kills * XP_PER_KILL;
  if (stats.survived) xp += XP_PER_SURVIVAL;
  return xp;
}
