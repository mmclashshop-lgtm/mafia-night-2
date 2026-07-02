// Types
export type { Phase, Team, RoleId, Role, NightAction, ActionType, Player, Vote, GameSettings, GameEvent, GameState, WitchState } from './types/game';
export type { ClientToServerEvents, ServerToClientEvents, ServerToClientEventsData } from './types/events';
export type { PlayerId, RoomId, SocketId, UserId } from './types/ids';
export { createPlayerId, createRoomId, createSocketId, createUserId, generateId } from './types/ids';
export { DEFAULT_GAME_SETTINGS } from './types/game';

// Constants
export { ROLES, ROLE_ORDER, TEAM_NAMES, TEAM_COLORS } from './constants/roles';
export { PHASE_ORDER, PHASE_LABELS, PHASE_DURATIONS, MIN_PLAYERS, MAX_PLAYERS, ROOM_CODE_LENGTH } from './constants/phases';

// Achievements
export type { AchievementId, Achievement, RankTierId } from './types/achievements';
export { ACHIEVEMENTS, RANK_TIERS, getRank, calculateScore } from './types/achievements';

// Schemas
export { createRoomSchema, joinRoomSchema, nightActionSchema, voteSchema, chatMessageSchema, gameSettingsSchema } from './schemas/zod';

// Engine
export { createInitialState, addEvent, getAlivePlayers, getPlayersByTeam, getMafiaPlayers, getPlayerById, canPhaseTransition, isNightActionPhase, isDayPhase, isVotingPhase } from './engine/gameEngine';
export { assignRoles, getPlayerTargets, getDistribution, getAvailablePresets } from './engine/phaseManager';
export { resolveNightActions, resolveVotes } from './engine/actionResolver';
export { checkWinCondition, shouldEndNightEarly, getGameEndReason } from './engine/winConditions';
