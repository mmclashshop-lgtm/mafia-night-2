import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config';
import { registerRoomHandlers } from './handlers/room';
import { registerGameHandlers } from './handlers/game';
import { registerChatHandlers } from './handlers/chat';
import { registerMatchmakingHandlers } from './handlers/matchmaking';
import { matchmakingQueue } from '../rooms/matchmaking';

export function createSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: config.cors,
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
  });

  matchmakingQueue.init(io);

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerMatchmakingHandlers(io, socket);
  });

  return io;
}
