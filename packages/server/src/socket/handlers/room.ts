import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { RoomId } from '@mafia/shared';
import { roomStore } from '../../rooms/store';
import { RoomManager } from '../../rooms/manager';
import { joinRoomSchema, createRoomSchema, reconnectSchema, updateSettingsSchema, addBotsSchema } from '@mafia/shared';
import { withRateLimit } from '../../auth/rateLimitWrapper';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on('room:create', withRateLimit('room:create', socket, (data: unknown, callback) => {
    const parsed = createRoomSchema.safeParse(data);
    if (!parsed.success) {
      callback({ error: 'Invalid data' });
      return;
    }

    const room = new RoomManager(io);
    roomStore.set(room.code as unknown as RoomId, room);

    socket.join(room.code);
    callback({ roomCode: room.code });
  }));

  socket.on('room:join', withRateLimit('room:join', socket, (data: unknown, callback) => {
    const parsed = joinRoomSchema.safeParse(data);
    if (!parsed.success) {
      callback({ success: false, error: 'Invalid data' });
      return;
    }

    const { roomCode, name, reconnectToken } = parsed.data;
    const room = roomStore.get(roomCode as unknown as RoomId);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const result = room.addPlayer(socket, name, reconnectToken);
    if (result.success && result.player) {
      callback({ success: true, state: room.getStateForSocket(socket.id), token: result.token });
    } else {
      callback({ success: false, error: result.error });
    }
  }));

  socket.on('room:updateSettings', withRateLimit('room:updateSettings', socket, (data: unknown, callback) => {
    const parsed = updateSettingsSchema.safeParse(data);
    if (!parsed.success) {
      callback({ success: false, error: 'Invalid settings data' });
      return;
    }

    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        if (!room.isHostSocket(socket.id)) {
          callback({ success: false, error: 'Only the host can update settings' });
          return;
        }
        room.updateSettings(parsed.data);
        callback({ success: true, state: room.stateSnapshot });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  }));

  socket.on('room:addBots', withRateLimit('room:addBots', socket, (data: unknown, callback) => {
    const parsed = addBotsSchema.safeParse(data);
    if (!parsed.success) {
      callback({ success: false, error: 'Invalid bot count' });
      return;
    }

    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        if (!room.isHostSocket(socket.id)) {
          callback({ success: false, error: 'Only the host can add bots' });
          return;
        }
        room.addBots(parsed.data.count);
        callback({ success: true, state: room.stateSnapshot });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  }));

  socket.on('room:toggleReady', withRateLimit('room:toggleReady', socket, (callback) => {
    for (const room of roomStore.getAll()) {
      const playerId = room.getPlayerIdBySocket(socket.id);
      if (playerId) {
        room.toggleReady(socket.id);
        callback({ success: true });
        return;
      }
    }
    callback({ success: false, error: 'Not in a room' });
  }));

  socket.on('room:reconnect', withRateLimit('room:reconnect', socket, (data: unknown, callback) => {
    const parsed = reconnectSchema.safeParse(data);
    if (!parsed.success) {
      callback({ success: false, error: 'Invalid data' });
      return;
    }

    const { roomCode, userId, reconnectToken } = parsed.data;
    const room = roomStore.get(roomCode as unknown as RoomId);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const result = room.addPlayer(socket, '', reconnectToken);
    if (result.success && result.player) {
      callback({ success: true, state: room.getStateForSocket(socket.id), token: result.token });
    } else {
      callback({ success: false, error: result.error ?? 'Reconnection failed' });
    }
  }));

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

  socket.on('disconnect', () => {
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
