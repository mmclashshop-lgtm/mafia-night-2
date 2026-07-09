import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config';
import { authMiddleware } from '../auth/middleware';
import { startRateLimitCleanup } from '../auth/rateLimiter';
import { registerRoomHandlers } from './handlers/room';
import { registerGameHandlers } from './handlers/game';
import { registerChatHandlers } from './handlers/chat';
import { registerMatchmakingHandlers } from './handlers/matchmaking';
import { registerSocialHandlers, startPartyCleanup } from './handlers/social';
import { matchmakingQueue } from '../rooms/matchmaking';

export function createSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: config.cors,
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
  });

  matchmakingQueue.init(io);
  startRateLimitCleanup();
  startPartyCleanup();

  io.use(authMiddleware);

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerMatchmakingHandlers(io, socket);
    registerSocialHandlers(io, socket);
  });

  return io;
}
