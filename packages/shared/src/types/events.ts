import { GameState, Vote, NightAction, Player } from './game';
import { PlayerId } from './ids';

// Client -> Server
export interface ClientToServerEvents {
  'room:create': (data: { settings: Record<string, unknown> }, callback: (res: { roomCode: string }) => void) => void;
  'room:join': (data: { roomCode: string; name: string }, callback: (res: { success: boolean; state?: GameState; error?: string }) => void) => void;
  'room:leave': () => void;
  'game:start': (callback: (res: { success: boolean; error?: string }) => void) => void;
  'action:night': (data: { targetId: PlayerId; actionType: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'action:vote': (data: { targetId: PlayerId }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'chat:message': (data: { text: string }) => void;
  'voice:signal': (data: { to: string; signal: unknown }) => void;
  'voice:join': () => void;
  'voice:leave': () => void;
  'matchmaking:join': (data: { name: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'matchmaking:leave': () => void;
}

// Server -> Client
export interface ServerToClientEvents {
  'state:sync': (data: { state: GameState }) => void;
  'phase:change': (data: { phase: string; endsAt: number }) => void;
  'player:joined': (data: { player: Player }) => void;
  'player:left': (data: { playerId: PlayerId }) => void;
  'player:died': (data: { playerId: PlayerId; role: string }) => void;
  'vote:cast': (data: { from: PlayerId; to: PlayerId }) => void;
  'vote:result': (data: { eliminated: PlayerId | null; votes: Vote[] }) => void;
  'chat:message': (data: { from: PlayerId; name: string; text: string; timestamp: number }) => void;
  'voice:signal': (data: { from: string; signal: unknown }) => void;
  'voice:user-joined': (data: { userId: string }) => void;
  'voice:user-left': (data: { userId: string }) => void;
  'error': (data: { code: string; message: string }) => void;
  'game:end': (data: { winner: string; stats: Record<string, unknown> }) => void;
  'matchmaking:update': (data: { queueSize: number }) => void;
  'matchmaking:found': (data: { roomCode: string; state: GameState }) => void;
  'achievements:unlocked': (data: { achievements: string[]; score: number; rank: string }) => void;
}

export interface ServerToClientEventsData {
  'state:sync': { state: GameState };
  'phase:change': { phase: string; endsAt: number };
  'player:joined': { player: Player };
  'player:left': { playerId: PlayerId };
  'player:died': { playerId: PlayerId; role: string };
  'vote:cast': { from: PlayerId; to: PlayerId };
  'vote:result': { eliminated: PlayerId | null; votes: Vote[] };
  'chat:message': { from: PlayerId; name: string; text: string; timestamp: number };
  'voice:signal': { from: string; signal: unknown };
  'voice:user-joined': { userId: string };
  'voice:user-left': { userId: string };
  'error': { code: string; message: string };
  'game:end': { winner: string; stats: Record<string, unknown> };
  'matchmaking:update': { queueSize: number };
  'matchmaking:found': { roomCode: string; state: GameState };
  'achievements:unlocked': { achievements: string[]; score: number; rank: string };
}
