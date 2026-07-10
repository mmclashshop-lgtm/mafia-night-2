import { z } from 'zod';

const roomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/);
const playerNameSchema = z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9_\u0600-\u06FF ]+$/);
const playerIdSchema = z.string().min(1);

export const gameSettingsSchema = z.object({
  minPlayers: z.number().int().min(4).max(12).default(4),
  maxPlayers: z.number().int().min(4).max(12).default(12),
  nightDuration: z.number().int().min(10).max(120).default(30),
  dayDuration: z.number().int().min(10).max(180).default(60),
  votingDuration: z.number().int().min(10).max(120).default(30),
  roleDistribution: z.record(z.number().int().min(0)).optional(),
  allowSpectators: z.boolean().default(true),
  enableVoiceChat: z.boolean().default(true),
  enableTextChat: z.boolean().default(true),
  enableMafiaChat: z.boolean().default(true),
  rolePreset: z.enum(['classic', 'advanced', 'chaos']).default('classic'),
  mode: z.enum(['casual', 'competitive']).default('casual'),
}).strict();

export const createRoomSchema = z.object({
  settings: gameSettingsSchema.partial().optional(),
}).strict();

export const joinRoomSchema = z.object({
  roomCode: roomCodeSchema,
  name: playerNameSchema,
  reconnectToken: z.string().optional(),
}).strict();

export const reconnectSchema = z.object({
  roomCode: roomCodeSchema,
  userId: playerIdSchema,
  reconnectToken: z.string().min(1),
}).strict();

export const nightActionSchema = z.object({
  targetId: playerIdSchema,
  actionType: z.enum([
    'mafia', 'doctor', 'cop', 'villager',
    'godfather', 'serial_killer', 'mayor', 'lovers',
    'jester', 'detective', 'medic', 'sniper',
    'vigilante', 'witch', 'spy',
    'witch_save', 'witch_kill',
  ]),
}).strict();

export const voteSchema = z.object({
  targetId: z.union([playerIdSchema, z.literal('skip')]),
}).strict();

export const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(500),
}).strict();

export const addBotsSchema = z.object({
  count: z.number().int().min(1).max(12),
}).strict();

export const voiceSignalSchema = z.object({
  to: playerIdSchema,
  signal: z.unknown(),
}).strict();

export const updateSettingsSchema = gameSettingsSchema.partial().strict();

export const matchmakingJoinSchema = z.object({
  name: playerNameSchema,
  mode: z.enum(['casual', 'competitive']).optional(),
}).strict();
