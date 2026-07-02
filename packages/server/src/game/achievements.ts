import type { AchievementId } from '@mafia/shared';
import type { StoredPlayer } from '../db';

interface GameContext {
  player: StoredPlayer;
  allPlayers: StoredPlayer[];
  winner: string | null;
  dayCount: number;
  playerTeamAliveCount: number;
  witchSaved: boolean;
  witchKilled: boolean;
}

interface AchievementCheck {
  id: AchievementId;
  condition: (ctx: GameContext) => boolean;
}

export const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  {
    id: 'comeback_king',
    condition: (ctx) => {
      if (ctx.player.team !== ctx.winner) return false;
      const teamPlayers = ctx.allPlayers.filter((p) => p.team === ctx.player.team);
      const aliveTeamPlayers = ctx.allPlayers.filter(
        (p) => p.team === ctx.player.team && p.alive
      );
      return teamPlayers.length > 1 && aliveTeamPlayers.length === 1 && ctx.player.alive;
    },
  },
  {
    id: 'witchs_brew',
    condition: (ctx) => {
      if (ctx.player.role !== 'witch') return false;
      if (ctx.player.team !== ctx.winner) return false;
      return ctx.witchSaved && ctx.witchKilled;
    },
  },
  {
    id: 'sniper_elite',
    condition: (ctx) => {
      if (ctx.player.role !== 'sniper') return false;
      if (ctx.player.team !== ctx.winner) return false;
      return ctx.player.kills >= 3;
    },
  },
  {
    id: 'perfect_game',
    condition: (ctx) => {
      if (ctx.player.team !== ctx.winner) return false;
      const teamPlayers = ctx.allPlayers.filter((p) => p.team === ctx.player.team);
      const aliveTeamPlayers = ctx.allPlayers.filter(
        (p) => p.team === ctx.player.team && p.alive
      );
      return teamPlayers.length === aliveTeamPlayers.length;
    },
  },
  {
    id: 'fast_win',
    condition: (ctx) => {
      if (ctx.player.team !== ctx.winner) return false;
      return ctx.dayCount <= 2;
    },
  },
  {
    id: 'last_standing',
    condition: (ctx) => {
      if (ctx.player.team !== ctx.winner) return false;
      const alivePlayers = ctx.allPlayers.filter((p) => p.alive);
      return alivePlayers.length === 1 && alivePlayers[0]?.name === ctx.player.name;
    },
  },
];

export function checkNewAchievements(
  context: GameContext,
  existingAchievements: AchievementId[]
): AchievementId[] {
  const newAchievements: AchievementId[] = [];

  for (const check of ACHIEVEMENT_CHECKS) {
    if (!existingAchievements.includes(check.id) && check.condition(context)) {
      newAchievements.push(check.id);
    }
  }

  return newAchievements;
}

export function checkProgressiveAchievements(
  totalGames: number,
  totalWins: number,
  existingAchievements: AchievementId[]
): AchievementId[] {
  const newAchievements: AchievementId[] = [];

  if (totalWins >= 1 && !existingAchievements.includes('first_blood')) {
    newAchievements.push('first_blood');
  }
  if (totalGames >= 10 && !existingAchievements.includes('survivor')) {
    newAchievements.push('survivor');
  }
  if (totalGames >= 50 && !existingAchievements.includes('veteran')) {
    newAchievements.push('veteran');
  }
  if (totalGames >= 100 && !existingAchievements.includes('legend')) {
    newAchievements.push('legend');
  }
  if (totalWins >= 5 && !existingAchievements.includes('puppet_master')) {
    newAchievements.push('puppet_master');
  }

  return newAchievements;
}
