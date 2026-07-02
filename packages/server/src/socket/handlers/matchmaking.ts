import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { matchmakingQueue } from '../../rooms/matchmaking';

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
  socket.on('matchmaking:join', (data: { name: string }, callback) => {
    if (!data || !data.name || !data.name.trim()) {
      callback({ success: false, error: 'Name is required' });
      return;
    }
    const result = matchmakingQueue.enqueue(socket.id, data.name.trim());
    callback(result);
  });

  socket.on('matchmaking:leave', () => {
    matchmakingQueue.dequeue(socket.id);
  });

  socket.on('disconnect', () => {
    matchmakingQueue.removeBySocket(socket.id);
  });
}
