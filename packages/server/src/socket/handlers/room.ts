import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { RoomId } from '@mafia/shared';
import { roomStore } from '../../rooms/store';
import { RoomManager } from '../../rooms/manager';
import { joinRoomSchema, createRoomSchema } from '@mafia/shared';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('room:create', (data: unknown, callback) => {
    const parsed = createRoomSchema.safeParse(data);
    if (!parsed.success) {
      callback({ error: 'Invalid data' });
      return;
    }

    const room = new RoomManager(io);
    roomStore.set(room.code as unknown as RoomId, room);

    socket.join(room.code);
    callback({ roomCode: room.code });
  });

  socket.on('room:join', (data: unknown, callback) => {
    const parsed = joinRoomSchema.safeParse(data);
    if (!parsed.success) {
      callback({ success: false, error: 'Invalid data' });
      return;
    }

    const { roomCode, name } = parsed.data;
    const room = roomStore.get(roomCode as unknown as RoomId);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const result = room.addPlayer(socket, name);
    if (result.success && result.player) {
      callback({ success: true, state: room.stateSnapshot });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  socket.on('room:updateSettings', (data: Record<string, unknown>, callback) => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.updateSettings(data);
        callback({ success: true, state: room.stateSnapshot });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  });

  socket.on('room:addBots', (data: { count: number }, callback) => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.addBots(data.count);
        callback({ success: true, state: room.stateSnapshot });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  });

  socket.on('room:toggleReady', (callback) => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.toggleReady(socket.id);
        callback({ success: true });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  });

  socket.on('room:leave', () => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.removePlayer(socket.id);
        socket.leave(room.code);
        break;
      }
    }
  });
}
