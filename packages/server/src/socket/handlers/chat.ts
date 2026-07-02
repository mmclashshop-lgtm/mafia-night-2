import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { PlayerId } from '@mafia/shared';
import { roomStore } from '../../rooms/store';
import { chatMessageSchema } from '@mafia/shared';

export function registerChatHandlers(io: Server, socket: Socket): void {
  socket.on('chat:mafia', (data: unknown) => {
    const parsed = chatMessageSchema.safeParse(data);
    if (!parsed.success) return;
    const { text } = parsed.data;
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.addMafiaChatMessage(socket.id, text);
        return;
      }
    }
  });

  socket.on('chat:message', (data: unknown) => {
    const parsed = chatMessageSchema.safeParse(data);
    if (!parsed.success) return;

    const { text } = parsed.data;
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.addChatMessage(socket.id, text);
        return;
      }
    }
  });

  socket.on('voice:signal', (data: { to: string; signal: unknown }) => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        const targetSocketId = room.getSocketByPlayerId(data.to as unknown as PlayerId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('voice:signal', {
            from: socket.id,
            signal: data.signal,
          });
        }
        return;
      }
    }
  });

  socket.on('voice:join', () => {
    socket.to(socket.data.roomId).emit('voice:user-joined', { userId: socket.id });
  });

  socket.on('voice:leave', () => {
    socket.to(socket.data.roomId).emit('voice:user-left', { userId: socket.id });
  });
}
