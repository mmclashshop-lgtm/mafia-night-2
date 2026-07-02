import { PlayerId } from './ids';

export type Phase = 'lobby' | 'night' | 'day' | 'voting' | 'ended';

export type Team = 'mafia' | 'town' | 'neutral' | 'lovers';

export type RoleId =
  | 'mafia'
  | 'doctor'
  | 'cop'
  | 'villager'
  | 'godfather'
  | 'serial_killer'
  | 'mayor'
  | 'lovers'
  | 'jester'
  | 'detective'
  | 'medic'
  | 'sniper'
  | 'vigilante'
  | 'witch'
  | 'spy';

export interface Role {
  id: RoleId;
  name: string;
  team: Team;
  description: string;
  nightAction: boolean;
  actionTarget: 'player' | 'self' | 'none';
  priority: number;
  maxUses: number;
  emoji: string;
}

export type ActionType = RoleId | 'witch_save' | 'witch_kill';

export interface NightAction {
  type: ActionType;
  targetId: PlayerId;
  phaseDay: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  role: Role | null;
  team: Team;
  alive: boolean;
  disconnected: boolean;
  votedFor: PlayerId | null;
  nightAction: NightAction | null;
  isBot: boolean;
  ready: boolean;
  joinedAt: number;
  lastActiveAt: number;
}

export interface Vote {
  from: PlayerId;
  to: PlayerId;
}

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  nightDuration: number;
  dayDuration: number;
  votingDuration: number;
  roleDistribution: Record<string, number>;
  allowSpectators: boolean;
  enableVoiceChat: boolean;
  enableTextChat: boolean;
  enableMafiaChat: boolean;
  rolePreset: 'classic' | 'advanced' | 'chaos';
}

export interface GameEvent {
  id: string;
  type: 'kill' | 'heal' | 'investigate' | 'vote' | 'lynch' | 'reveal' | 'phase_change' | 'chat';
  timestamp: number;
  data: unknown;
}

export interface WitchState {
  savePotionUsed: boolean;
  killPotionUsed: boolean;
  savedPlayerId?: PlayerId;
}

export interface GameState {
  id: string;
  roomCode: string;
  phase: Phase;
  phaseStartedAt: number;
  phaseEndsAt: number;
  players: Player[];
  day: number;
  winner: Team | null;
  history: GameEvent[];
  settings: GameSettings;
  votes: Vote[];
  eliminated: Player[];
  rolesAssigned: boolean;
  witchState: WitchState | null;
  mafiaIds: PlayerId[];
  loverPair: [PlayerId, PlayerId] | null;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
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
};
