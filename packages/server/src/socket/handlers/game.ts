import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { roomStore } from '../../rooms/store';
import { nightActionSchema, voteSchema, createPlayerId } from '@mafia/shared';
import { withRateLimit } from '../../auth/rateLimitWrapper';

export function registerGameHandlers(io: Server, socket: Socket): void {
  socket.on('game:start', withRateLimit('game:start', socket, (callback: (result: { success: boolean; error?: string }) => void) => {
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
  }));

  socket.on('action:night', withRateLimit('action:night', socket, (data: unknown, callback) => {
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
  }));

  socket.on('game:playAgain', (callback) => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.resetGame();
        callback({ success: true });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  });

  socket.on('action:vote', withRateLimit('action:vote', socket, (data: unknown, callback) => {
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
  }));
}
