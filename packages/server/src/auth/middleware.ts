import { Socket } from 'socket.io';
import { verifyToken } from './token';

export function authMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const { userId, token } = socket.handshake.auth ?? {};

  if (userId && token) {
    if (!verifyToken(userId, token)) {
      return next(new Error('Authentication failed: invalid token'));
    }
    socket.data.userId = userId;
    socket.data.authenticated = true;
  } else {
    socket.data.authenticated = false;
  }

  next();
}
