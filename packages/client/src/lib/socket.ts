import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env['VITE_SOCKET_URL'] || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(userId?: string, token?: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { userId, token };
    s.connect();
  }
  return s;
}

export function updateSocketAuth(userId: string, token: string): void {
  const s = getSocket();
  s.auth = { userId, token };
  if (s.connected) {
    s.disconnect();
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
