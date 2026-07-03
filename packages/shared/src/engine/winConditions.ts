import { GameState, Team } from '../types/game';
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

  const mafiaAlive = alivePlayers.filter(p => p.team === 'mafia');
  const townAlive = alivePlayers.filter(p => p.team === 'town');
  const loversAlive = alivePlayers.filter(p => p.team === 'lovers');
  const neutralAlive = alivePlayers.filter(p => p.team === 'neutral');

  // Lovers win if both lovers are alive and no other team can win
  // (All non-lover players are dead, or lovers + their team outnumber all others)
  const loverPair = state.loverPair;
  const loverIds: string[] = loverPair ? [...loverPair] : [];
  const aliveLovers = loverIds.filter(id => alivePlayers.some(p => p.id === id));
  const nonLoverPlayers = alivePlayers.filter(p => !loverIds.includes(p.id));
  if (aliveLovers.length === 2 && nonLoverPlayers.length === 0) {
    return 'lovers';
  }
  // Lovers win if they + their aligned team outnumber everyone else
  if (aliveLovers.length >= 1) {
    const loverTeams = new Set(
      loverIds
        .map(id => alivePlayers.find(p => p.id === id)?.team)
        .filter((t): t is Team => t !== undefined)
    );
    const allOtherAlive = alivePlayers.filter(p => !loverIds.includes(p.id));
    const otherTeamsSet = new Set(allOtherAlive.map(p => p.team));
    if (otherTeamsSet.size <= 1 && loverTeams.size >= 1) {
      const firstTeam = [...loverTeams][0];
      const loverSideCount = alivePlayers.filter(p => loverIds.includes(p.id) || (p.team === firstTeam)).length;
      if (loverSideCount >= allOtherAlive.length) {
        return 'lovers';
      }
    }
  }

  // Mafia wins if they outnumber or equal ALL non-mafia (including neutrals and lovers)
  const nonMafiaAlive = alivePlayers.filter(p => p.team !== 'mafia');
  if (mafiaAlive.length >= nonMafiaAlive.length && nonMafiaAlive.length > 0) {
    return 'mafia';
  }

  // Serial killer wins if they're the sole remaining threat
  const skAlive = neutralAlive.filter(p => p.role?.id === 'serial_killer');
  const otherNeutralsAlive = neutralAlive.filter(p => p.role?.id !== 'serial_killer');
  if (skAlive.length === 1 && otherNeutralsAlive.length === 0 && mafiaAlive.length <= 1 && townAlive.length <= 1) {
    return 'neutral';
  }

  // Town wins if all mafia, neutrals, and lovers are dead
  if (mafiaAlive.length === 0 && neutralAlive.length === 0 && loversAlive.length === 0) {
    return 'town';
  }

  // Fallback: last man standing — if only 2 teams remain and one has no chance
  if (mafiaAlive.length > 0 && neutralAlive.length > 0 && townAlive.length === 0 && loversAlive.length === 0) {
    const nonMafiaCount = neutralAlive.length;
    if (mafiaAlive.length >= nonMafiaCount) return 'mafia';
    if (nonMafiaCount >= mafiaAlive.length && skAlive.length === 1) return 'neutral';
  }

  if (townAlive.length > 0 && neutralAlive.length > 0 && mafiaAlive.length === 0 && loversAlive.length === 0) {
    if (townAlive.length > neutralAlive.length) return 'town';
  }

  // If only neutral non-SK players remain + one other team, neutrals win by outnumbering
  if (townAlive.length === 0 && mafiaAlive.length === 0 && loversAlive.length === 0 && neutralAlive.length > 0) {
    return 'neutral';
  }

  return null;
}

export function shouldEndNightEarly(state: GameState): boolean {
  const alivePlayers = getAlivePlayers(state);
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
