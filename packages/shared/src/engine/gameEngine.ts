import { GameState, Phase, GameEvent, Player } from '../types/game';

export function createInitialState(id: string, roomCode: string): GameState {
  return {
    id,
    roomCode,
    phase: 'lobby',
    phaseStartedAt: Date.now(),
    phaseEndsAt: Date.now() + 3600000,
    players: [],
    day: 0,
    winner: null,
    history: [],
    settings: {
      minPlayers: 4,
      maxPlayers: 12,
      nightDuration: 30,
      dayDuration: 60,
      votingDuration: 30,
      roleDistribution: {},
      allowSpectators: true,
      enableVoiceChat: true,
      enableTextChat: true,
      enableMafiaChat: true,
      rolePreset: 'classic',
    },
    votes: [],
    eliminated: [],
    rolesAssigned: false,
    witchState: null,
    mafiaIds: [],
    loverPair: null,
  };
}

export function addEvent(state: GameState, type: GameEvent['type'], data: unknown): GameState {
  const event: GameEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    timestamp: Date.now(),
    data,
  };
  return {
    ...state,
    history: [...state.history, event],
  };
}

export function getAlivePlayers(state: GameState): Player[] {
  return state.players.filter(p => p.alive);
}

export function getPlayersByTeam(state: GameState, team: string): Player[] {
  return state.players.filter(p => p.team === team && p.alive);
}

export function getMafiaPlayers(state: GameState): Player[] {
  return getPlayersByTeam(state, 'mafia');
}

export function getPlayerById(state: GameState, id: string): Player | undefined {
  return state.players.find(p => p.id === id);
}

export function canPhaseTransition(from: Phase, to: Phase): boolean {
  const order: Phase[] = ['lobby', 'night', 'day', 'voting', 'ended'];
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);
  if (from === 'lobby' && to === 'night') return true;
  if (from === 'night' && to === 'day') return true;
  if (from === 'day' && to === 'voting') return true;
  if (from === 'voting' && (to === 'night' || to === 'ended')) return true;
  return false;
}

export function isNightActionPhase(state: GameState): boolean {
  return state.phase === 'night';
}

export function isDayPhase(state: GameState): boolean {
  return state.phase === 'day';
}

export function isVotingPhase(state: GameState): boolean {
  return state.phase === 'voting';
}
