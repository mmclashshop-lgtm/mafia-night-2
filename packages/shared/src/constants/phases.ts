import { Phase } from '../types/game';

export const PHASE_ORDER: Phase[] = ['lobby', 'night', 'day', 'voting', 'ended'];

export const PHASE_LABELS: Record<Phase, string> = {
  lobby: 'Lobby',
  night: '🌙 Night',
  day: '☀️ Day',
  voting: '🗳️ Voting',
  ended: 'Game Over',
};

export const PHASE_DURATIONS: Record<Phase, number> = {
  lobby: 0,
  night: 30,
  day: 60,
  voting: 30,
  ended: 0,
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;
export const ROOM_CODE_LENGTH = 6;
