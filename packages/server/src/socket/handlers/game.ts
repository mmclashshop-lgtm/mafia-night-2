import { Socket, Server } from 'socket.io';
import { roomStore } from '../../rooms/store';
import { nightActionSchema, voteSchema, createPlayerId } from '@mafia/shared';
import { withRateLimit } from '../../auth/rateLimitWrapper';

type Callback = (...args: any[]) => void;

function safeCall(roomOp: () => void, socket: Socket, callback?: Callback) {
  try {
    roomOp();
  } catch (err) {
    console.error('Handler error:', err);
    callback?.({ success: false, error: 'Internal server error' });
  }
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on('game:start', withRateLimit('game:start', socket, (callback: (result: { success: boolean; error?: string }) => void) => {
    safeCall(() => {
      for (const room of roomStore.getAll()) {
        const playerId = room.getPlayerIdBySocket(socket.id);
        if (playerId) {
          if (!room.isHostSocket(socket.id)) {
            callback({ success: false, error: 'Only the host can start the game' });
            return;
          }
          const result = room.startGame(socket.id);
          callback(result);
          return;
        }
      }
      callback({ success: false, error: 'Not in a room' });
    }, socket, callback);
  }));

  socket.on('action:night', withRateLimit('action:night', socket, (data: unknown, callback) => {
    safeCall(() => {
      const parsed = nightActionSchema.safeParse(data);
      if (!parsed.success) {
        callback({ success: false, error: 'Invalid data' });
        return;
      }

      const { targetId, actionType } = parsed.data;
      for (const room of roomStore.getAll()) {
        const playerId = room.getPlayerIdBySocket(socket.id);
        if (playerId) {
          const result = room.submitNightAction(socket.id, createPlayerId(targetId), actionType);
          callback(result);
          return;
        }
      }
      callback({ success: false, error: 'Not in a room' });
    }, socket, callback);
  }));

  socket.on('game:playAgain', (callback) => {
    safeCall(() => {
      for (const room of roomStore.getAll()) {
        const playerId = room.getPlayerIdBySocket(socket.id);
        if (playerId) {
          room.resetGame();
          callback({ success: true });
          return;
        }
      }
      callback({ success: false, error: 'Not in a room' });
    }, socket, callback);
  });

  socket.on('action:vote', withRateLimit('action:vote', socket, (data: unknown, callback) => {
    safeCall(() => {
      const parsed = voteSchema.safeParse(data);
      if (!parsed.success) {
        callback({ success: false, error: 'Invalid data' });
        return;
      }

      const { targetId } = parsed.data;
      for (const room of roomStore.getAll()) {
        const playerId = room.getPlayerIdBySocket(socket.id);
        if (playerId) {
          const result = room.submitVote(socket.id, createPlayerId(targetId));
          callback(result);
          return;
        }
      }
      callback({ success: false, error: 'Not in a room' });
    }, socket, callback);
  }));
}
