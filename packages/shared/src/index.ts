// Types
export type { Phase, Team, RoleId, Role, NightAction, ActionType, Player, Vote, GameSettings, GameEvent, GameState, WitchState, GameMode } from './types/game';
export type { Token, AuthPayload, ReconnectPayload } from './types/auth';
export type { ClientToServerEvents, ServerToClientEvents, ServerToClientEventsData } from './types/events';
export type { PlayerId, RoomId, SocketId, UserId } from './types/ids';
export { createPlayerId, createRoomId, createSocketId, createUserId, generateId } from './types/ids';
export { DEFAULT_GAME_SETTINGS } from './types/game';

// Constants
export { ROLES, ROLE_ORDER, TEAM_NAMES, TEAM_COLORS } from './constants/roles';
export { PHASE_ORDER, PHASE_LABELS, PHASE_DURATIONS, MIN_PLAYERS, MAX_PLAYERS, ROOM_CODE_LENGTH } from './constants/phases';

export { RANK_TIERS, getRank, calculateScore } from './types/achievements';

// Schemas
export { createRoomSchema, joinRoomSchema, reconnectSchema, nightActionSchema, voteSchema, chatMessageSchema, gameSettingsSchema, addBotsSchema, voiceSignalSchema, updateSettingsSchema, matchmakingJoinSchema } from './schemas/zod';

// Engine
export { createInitialState, addEvent, getAlivePlayers, getPlayersByTeam, getMafiaPlayers, getPlayerById, canPhaseTransition, isNightActionPhase, isDayPhase, isVotingPhase } from './engine/gameEngine';
export { assignRoles, getPlayerTargets, getDistribution, getAvailablePresets } from './engine/phaseManager';
export { resolveNightActions, resolveVotes } from './engine/actionResolver';
export { checkWinCondition, shouldEndNightEarly, getGameEndReason } from './engine/winConditions';

// MMR / ELO
export { calculateElo, getAverageElo, getEloRange, calculateGameElo, DEFAULT_ELO } from './engine/mmr';

// Progression
export { getLevel, getLevelProgress, calculateGameXP, pickDailyQuests, getXPForLevel, DAILY_QUESTS_POOL } from './engine/progression';
export type { DailyQuest } from './engine/progression';

// Network / Social types
export type { FriendProfile, FriendRequest, PartyMember, Party, FriendStatus, OnlineStatus } from './types/network';
