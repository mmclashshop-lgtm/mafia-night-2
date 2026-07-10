import { io, Socket } from 'socket.io-client';

// If on localhost, use same-origin (Vite proxies to backend)
// Otherwise use VITE_SOCKET_URL (for production cross-origin deployments)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const VITE_URL = import.meta.env['VITE_SOCKET_URL'] as string | undefined;
const SOCKET_URL = isLocal ? '' : (VITE_URL || '');

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

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

const TIMEOUT_MS = 15000;

function rejectOnError<T>(res: unknown, reject: (err: Error) => void): res is T {
  if (res && typeof res === 'object' && 'error' in res && (res as any).error) {
    reject(new Error((res as any).error));
    return false;
  }
  return true;
}

export function emitWithData<T>(event: string, data: unknown, timeoutMs = TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const s = getSocket();
    const timer = setTimeout(() => reject(new Error('Server did not respond (timeout)')), timeoutMs);
    try {
      s.emit(event, data, (res: unknown) => {
        clearTimeout(timer);
        if (!rejectOnError<T>(res, reject)) return;
        resolve(res as T);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error('Failed to emit event'));
    }
  });
}

export function emitNoData<T>(event: string, timeoutMs = TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const s = getSocket();
    const timer = setTimeout(() => reject(new Error('Server did not respond (timeout)')), timeoutMs);
    try {
      s.emit(event, (res: unknown) => {
        clearTimeout(timer);
        if (!rejectOnError<T>(res, reject)) return;
        resolve(res as T);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error('Failed to emit event'));
    }
  });
}

export function emitVoid(event: string): void {
  getSocket().emit(event);
}
