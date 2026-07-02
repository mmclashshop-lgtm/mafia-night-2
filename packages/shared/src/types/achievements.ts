export type AchievementId =
  | 'first_blood'
  | 'survivor'
  | 'veteran'
  | 'legend'
  | 'unstoppable'
  | 'comeback_king'
  | 'puppet_master'
  | 'sheriff'
  | 'doctors_touch'
  | 'vigilante_justice'
  | 'jesters_triumph'
  | 'lovers_oath'
  | 'witchs_brew'
  | 'godfather'
  | 'unkillable'
  | 'sniper_elite'
  | 'detective_work'
  | 'perfect_game'
  | 'fast_win'
  | 'last_standing';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  category: 'general' | 'role' | 'special';
  hidden?: boolean;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first game',
    icon: '🏆',
    category: 'general',
  },
  survivor: {
    id: 'survivor',
    name: 'Survivor',
    description: 'Play 10 games',
    icon: '🎮',
    category: 'general',
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran',
    description: 'Play 50 games',
    icon: '⭐',
    category: 'general',
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    description: 'Play 100 games',
    icon: '👑',
    category: 'general',
  },
  unstoppable: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Win 3 games in a row',
    icon: '🔥',
    category: 'special',
  },
  comeback_king: {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Win a game after being the last alive on your team',
    icon: '🔄',
    category: 'special',
  },
  puppet_master: {
    id: 'puppet_master',
    name: 'Puppet Master',
    description: 'Win 5 games as Mafia',
    icon: '🎭',
    category: 'role',
  },
  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    description: 'Win 5 games as Cop',
    icon: '🔍',
    category: 'role',
  },
  doctors_touch: {
    id: 'doctors_touch',
    name: "Doctor's Touch",
    description: 'Save 10 players as Doctor',
    icon: '💚',
    category: 'role',
  },
  vigilante_justice: {
    id: 'vigilante_justice',
    name: 'Vigilante Justice',
    description: 'Kill 5 players as Vigilante',
    icon: '🔫',
    category: 'role',
  },
  jesters_triumph: {
    id: 'jesters_triumph',
    name: "Jester's Triumph",
    description: 'Win 3 times as Jester',
    icon: '🎪',
    category: 'role',
  },
  lovers_oath: {
    id: 'lovers_oath',
    name: "Lovers' Oath",
    description: 'Win 3 times as Lovers',
    icon: '💕',
    category: 'role',
  },
  witchs_brew: {
    id: 'witchs_brew',
    name: "Witch's Brew",
    description: 'Use both potions in one game and win',
    icon: '🧪',
    category: 'role',
  },
  godfather: {
    id: 'godfather',
    name: 'Godfather',
    description: 'Win 5 games as Godfather',
    icon: '👔',
    category: 'role',
  },
  unkillable: {
    id: 'unkillable',
    name: 'Unkillable',
    description: 'Survive 5 games without dying',
    icon: '🛡️',
    category: 'special',
  },
  sniper_elite: {
    id: 'sniper_elite',
    name: 'Sniper Elite',
    description: 'Kill 3 players as Sniper in a single game',
    icon: '🎯',
    category: 'role',
  },
  detective_work: {
    id: 'detective_work',
    name: 'Detective Work',
    description: 'Investigate 10 players as Detective',
    icon: '📋',
    category: 'role',
  },
  perfect_game: {
    id: 'perfect_game',
    name: 'Perfect Game',
    description: 'Win without any teammate dying',
    icon: '💎',
    category: 'special',
  },
  fast_win: {
    id: 'fast_win',
    name: 'Fast Win',
    description: 'Win a game in 2 days or less',
    icon: '⚡',
    category: 'special',
  },
  last_standing: {
    id: 'last_standing',
    name: 'Last Standing',
    description: 'Be the sole survivor of your team and win',
    icon: '💀',
    category: 'special',
  },
};

export const RANK_TIERS = [
  { id: 'bronze', name: 'Bronze', minScore: 0, icon: '🥉' },
  { id: 'silver', name: 'Silver', minScore: 200, icon: '🥈' },
  { id: 'gold', name: 'Gold', minScore: 500, icon: '🥇' },
  { id: 'platinum', name: 'Platinum', minScore: 1000, icon: '💠' },
  { id: 'diamond', name: 'Diamond', minScore: 2000, icon: '💎' },
  { id: 'mafia_lord', name: 'Mafia Lord', minScore: 3500, icon: '👑' },
] as const;

export type RankTierId = (typeof RANK_TIERS)[number]['id'];

export function getRank(score: number): { id: string; name: string; minScore: number; icon: string } {
  let rank: { id: string; name: string; minScore: number; icon: string } = { ...RANK_TIERS[0] };
  for (const tier of RANK_TIERS) {
    if (score >= tier.minScore) rank = { ...tier };
  }
  return rank;
}

export function calculateScore(stats: {
  games: number;
  wins: number;
  kills: number;
  survivalRate: number;
}): number {
  return (
    stats.wins * 50 +
    stats.games * 5 +
    stats.kills * 10 +
    Math.round(stats.survivalRate * 2)
  );
}
