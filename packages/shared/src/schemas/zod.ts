import { z } from 'zod';

const roomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/);
const playerNameSchema = z.string().min(1).max(20).regex(/^[a-zA-Z0-9_\u0600-\u06FF ]+$/);
const playerIdSchema = z.string().min(1);

export const createRoomSchema = z.object({
  settings: z.record(z.unknown()).optional(),
});

export const joinRoomSchema = z.object({
  roomCode: roomCodeSchema,
  name: playerNameSchema,
});

export const nightActionSchema = z.object({
  targetId: playerIdSchema,
  actionType: z.string(),
});

export const voteSchema = z.object({
  targetId: playerIdSchema,
});

export const chatMessageSchema = z.object({
  text: z.string().min(1).max(500),
});

export const gameSettingsSchema = z.object({
  minPlayers: z.number().int().min(4).max(12).default(4),
  maxPlayers: z.number().int().min(4).max(12).default(12),
  nightDuration: z.number().int().min(10).max(120).default(30),
  dayDuration: z.number().int().min(10).max(180).default(60),
  votingDuration: z.number().int().min(10).max(120).default(30),
  roleDistribution: z.record(z.number()).optional(),
  allowSpectators: z.boolean().default(true),
  enableVoiceChat: z.boolean().default(true),
  enableTextChat: z.boolean().default(true),
});
