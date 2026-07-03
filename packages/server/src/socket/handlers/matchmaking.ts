import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { matchmakingQueue } from '../../rooms/matchmaking';
import { withRateLimit } from '../../auth/rateLimitWrapper';
import { matchmakingJoinSchema } from '@mafia/shared';

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  socket.on('matchmaking:join', withRateLimit('matchmaking:join', socket, (data: unknown, callback) => {
    const parsed = matchmakingJoinSchema.safeParse(data);
    if (!parsed.success) {
      callback({ success: false, error: 'Invalid data' });
      return;
    }

    const { name, mode } = parsed.data;
    const result = matchmakingQueue.enqueue(socket.id, name, mode ?? 'casual');
    callback(result);
  }));

  socket.on('matchmaking:leave', () => {
    matchmakingQueue.dequeue(socket.id);
  });

  socket.on('disconnect', () => {
    matchmakingQueue.removeBySocket(socket.id);
  });
}
