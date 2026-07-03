import { GameState, Player, RoleId } from '../types/game';
import { PlayerId } from '../types/ids';
import { ROLES } from '../constants/roles';
import { getAlivePlayers } from './gameEngine';

type Distribution = Record<string, number>;

const DISTRIBUTIONS: Record<string, Distribution> = {
  classic_4: { mafia: 1, doctor: 1, cop: 1, villager: 1 },
  classic_5: { mafia: 1, doctor: 1, cop: 1, villager: 2 },
  classic_6: { mafia: 2, doctor: 1, cop: 1, villager: 2 },
  classic_7: { mafia: 2, doctor: 1, cop: 1, villager: 3 },
  classic_8: { mafia: 2, doctor: 1, cop: 1, villager: 4 },
  classic_9: { mafia: 3, doctor: 1, cop: 1, villager: 4 },
  classic_10: { mafia: 3, doctor: 1, cop: 1, villager: 5 },
  classic_11: { mafia: 3, doctor: 1, cop: 1, villager: 6 },
  classic_12: { mafia: 4, doctor: 1, cop: 1, villager: 6 },

  advanced_6: { mafia: 1, godfather: 1, doctor: 1, cop: 1, vigilante: 1, villager: 1 },
  advanced_7: { mafia: 1, godfather: 1, doctor: 1, cop: 1, vigilante: 1, villager: 2 },
  advanced_8: { mafia: 1, godfather: 1, doctor: 1, detective: 1, vigilante: 1, serial_killer: 1, villager: 2 },
  advanced_9: { mafia: 2, godfather: 1, doctor: 1, cop: 1, vigilante: 1, serial_killer: 1, lovers: 2 },
  advanced_10: { mafia: 2, godfather: 1, doctor: 1, cop: 1, vigilante: 1, serial_killer: 1, witch: 1, jester: 1, villager: 1 },
  advanced_11: { mafia: 2, godfather: 1, medic: 1, detective: 1, sniper: 1, serial_killer: 1, witch: 1, jester: 1, spy: 1, villager: 1 },
  advanced_12: { mafia: 2, godfather: 1, doctor: 1, cop: 1, vigilante: 1, serial_killer: 1, witch: 1, jester: 1, spy: 1, mayor: 1, villager: 1 },

  chaos_8: { mafia: 1, godfather: 1, serial_killer: 1, witch: 1, jester: 1, vigilante: 1, lovers: 2 },
  chaos_9: { mafia: 1, godfather: 1, serial_killer: 1, witch: 1, jester: 1, vigilante: 1, spy: 1, lovers: 2 },
  chaos_10: { mafia: 2, godfather: 1, serial_killer: 1, witch: 1, jester: 1, vigilante: 1, spy: 1, lovers: 2 },
  chaos_11: { mafia: 2, godfather: 1, serial_killer: 1, witch: 1, jester: 1, vigilante: 1, spy: 1, sniper: 1, lovers: 2 },
  chaos_12: { mafia: 2, godfather: 1, serial_killer: 1, witch: 1, jester: 1, vigilante: 1, spy: 1, sniper: 1, medic: 1, lovers: 2 },
};

function shuffleArray<T>(arr: T[], seed?: string): T[] {
  const shuffled = [...arr];
  let rng = seed ? seededRandom(seed) : Math.random;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0x7fffffff;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export function getDistribution(playerCount: number, preset = 'classic'): Distribution | null {
  const key = `${preset}_${playerCount}`;
  return DISTRIBUTIONS[key] ?? null;
}

export function assignRoles(state: GameState, preset = 'classic'): GameState {
  const playerCount = state.players.length;
  const distribution = getDistribution(playerCount, preset);
  if (!distribution) return state;

  const rolePool: RoleId[] = [];
  for (const [roleId, count] of Object.entries(distribution)) {
    for (let i = 0; i < count; i++) {
      rolePool.push(roleId as RoleId);
    }
  }

  const shuffledRoles = shuffleArray(rolePool, state.id);

  const updatedPlayers = state.players.map((player, index) => {
    const roleId = shuffledRoles[index];
    if (!roleId) return player;
    const role = ROLES[roleId];
    if (!role) return player;
    return { ...player, role, team: role.team };
  });

  const mafiaIds = updatedPlayers
    .filter(p => p.team === 'mafia' && p.alive)
    .map(p => p.id) as PlayerId[];

  // Auto-assign lovers
  const loverPlayers = updatedPlayers.filter(p => p.role?.id === 'lovers');
  let loverPair: [PlayerId, PlayerId] | null = null;
  if (loverPlayers.length >= 2) {
    const shuffled = shuffleArray(loverPlayers, state.id);
    loverPair = [shuffled[0]!.id, shuffled[1]!.id] as [PlayerId, PlayerId];
  }

  // Track witch
  const witchPlayer = updatedPlayers.find(p => p.role?.id === 'witch');
  const witchState = witchPlayer
    ? { savePotionUsed: false, killPotionUsed: false }
    : null;

  return {
    ...state,
    players: updatedPlayers,
    mafiaIds,
    loverPair,
    witchState,
  };
}

export function getPlayerTargets(state: GameState, playerId: string): Player[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const alivePlayers = getAlivePlayers(state);

  switch (player.role?.id) {
    case 'mafia':
    case 'godfather':
      return alivePlayers.filter(p => p.id !== playerId && p.team !== 'mafia');
    case 'serial_killer':
    case 'vigilante':
    case 'sniper':
      return alivePlayers.filter(p => p.id !== playerId);
    case 'doctor':
    case 'medic':
      return alivePlayers.filter(p => p.id !== playerId);
    case 'cop':
    case 'detective':
    case 'spy':
      return alivePlayers.filter(p => p.id !== playerId);
    case 'witch':
      return alivePlayers.filter(p => p.id !== playerId);
    default:
      return [];
  }
}

export function getAvailablePresets(playerCount: number): string[] {
  const presets: string[] = [];
  for (const key of Object.keys(DISTRIBUTIONS)) {
    const parts = key.split('_');
    const preset = parts[0];
    const count = parts[1];
    if (preset && count && parseInt(count) === playerCount) {
      presets.push(preset);
    }
  }
  return [...new Set(presets)];
}
