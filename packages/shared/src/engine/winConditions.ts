import { GameState, Team, Player } from '../types/game';
import { getAlivePlayers } from './gameEngine';

export function checkWinCondition(state: GameState): Team | null {
  const alivePlayers = getAlivePlayers(state);
  if (alivePlayers.length === 0) return null;

  const aliveTeams = new Set(alivePlayers.map(p => p.team));

  // Single team remaining
  if (aliveTeams.size === 1) {
    const team = aliveTeams.values().next().value;
    return team ?? null;
  }

  // Check specific win conditions
  const mafiaAlive = alivePlayers.filter(p => p.team === 'mafia');
  const townAlive = alivePlayers.filter(p => p.team === 'town');
  const neutralAlive = alivePlayers.filter(p => p.team === 'neutral');

  // Mafia wins if they equal or outnumber town
  if (mafiaAlive.length >= townAlive.length && neutralAlive.length === 0) {
    return 'mafia';
  }

  // Serial killer wins if they're the only neutral and town+mafia can't stop them
  if (neutralAlive.length === 1 && neutralAlive[0]?.role?.id === 'serial_killer') {
    if (mafiaAlive.length <= 1 && townAlive.length <= 1) {
      return 'neutral';
    }
  }

  // Town wins if all mafia and neutrals are dead
  if (mafiaAlive.length === 0 && neutralAlive.length === 0) {
    return 'town';
  }

  return null;
}

export function shouldEndNightEarly(state: GameState): boolean {
  const alivePlayers = getAlivePlayers(state);
  const mafiaAlive = alivePlayers.filter(p => p.team === 'mafia');
  const townAlive = alivePlayers.filter(p => p.team === 'town');

  // If no one can perform actions, end night
  const playersWithActions = alivePlayers.filter(p => p.role?.nightAction);
  return playersWithActions.length === 0;
}

export function getGameEndReason(state: GameState, winner: Team): string {
  switch (winner) {
    case 'town':
      return 'The Town has eliminated all threats and restored peace!';
    case 'mafia':
      return 'The Mafia has taken over the town!';
    case 'neutral':
      return 'The Neutral forces have claimed victory!';
    case 'lovers':
      return 'The Lovers have survived together!';
    default:
      return 'Game Over!';
  }
}
