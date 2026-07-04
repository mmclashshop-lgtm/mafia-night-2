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
  'matchmaking:join': (data: { name: string; mode?: string; avatar?: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'matchmaking:leave': () => void;
  'friend:request': (data: { targetUserId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'friend:accept': (data: { requestId: string }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'friend:reject': (data: { requestId: string }) => void;
  'friend:remove': (data: { targetUserId: string }) => void;
  'party:create': (callback: (res: { success: boolean; partyId?: string }) => void) => void;
  'party:invite': (data: { targetUserId: string }) => void;
  'party:join': (data: { partyId: string }) => void;
  'party:leave': () => void;
  'party:kick': (data: { targetUserId: string }) => void;
  'party:startSearch': (data: { mode?: string }) => void;
  'party:cancelSearch': () => void;
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
  'game:rewards': (data: { xp: number; eloDelta: number; newElo: number; newLevel: number }) => void;
  'friend:request': (data: { requestId: string; fromName: string; fromAvatar: string }) => void;
  'friend:online': (data: { userId: string; status: string }) => void;
  'party:invite': (data: { partyId: string; fromName: string }) => void;
  'party:member-joined': (data: { userId: string; name: string }) => void;
  'party:member-left': (data: { userId: string }) => void;
  'party:member-ready': (data: { userId: string; ready: boolean }) => void;
  'party:disbanded': () => void;
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
  'game:rewards': { xp: number; eloDelta: number; newElo: number; newLevel: number };
}
