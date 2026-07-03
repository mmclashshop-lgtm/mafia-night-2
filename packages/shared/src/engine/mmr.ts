export type GameMode = 'casual' | 'competitive';

const DEFAULT_ELO = 1000;
const K_NEW = 40;
const K_ESTABLISHED = 20;
const NEW_PLAYER_THRESHOLD = 30;

interface EloInput {
  playerElo: number;
  opponentElo: number;
  score: number;
  gamesPlayed: number;
}

interface EloResult {
  newElo: number;
  delta: number;
}

export function calculateElo({ playerElo, opponentElo, score, gamesPlayed }: EloInput): EloResult {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const k = gamesPlayed < NEW_PLAYER_THRESHOLD ? K_NEW : K_ESTABLISHED;
  const delta = Math.round(k * (score - expected));
  return { newElo: Math.max(100, playerElo + delta), delta };
}

export function getTeamScore(team: string, winner: string | null): number {
  if (!winner) return 0.5;
  if (team === winner) return 1;
  return 0;
}

export function getAverageElo(elos: number[]): number {
  if (elos.length === 0) return DEFAULT_ELO;
  return Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);
}

export function getEloRange(elo: number, maxSpread = 400): { min: number; max: number } {
  return {
    min: Math.max(100, elo - maxSpread),
    max: elo + maxSpread,
  };
}

export function calculateGameElo(
  playerElo: number,
  opponentTeamElos: number[],
  team: string,
  winner: string | null,
  gamesPlayed: number
): EloResult {
  const avgOpponentElo = getAverageElo(opponentTeamElos);
  const score = getTeamScore(team, winner);
  return calculateElo({ playerElo, opponentElo: avgOpponentElo, score, gamesPlayed });
}

export { DEFAULT_ELO };
