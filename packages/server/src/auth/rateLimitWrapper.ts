import { Socket } from 'socket.io';
import { checkRateLimit } from './rateLimiter';

export function withRateLimit<T extends (...args: any[]) => void>(
  event: string,
  socket: Socket,
  handler: T
): T {
  const wrapped = ((...args: any[]) => {
    if (!checkRateLimit(socket.id, event)) {
      const callback = args.find(a => typeof a === 'function');
      if (callback) {
        callback({ success: false, error: 'Rate limit exceeded. Please slow down.' });
      }
      return;
    }
    handler(...args);
  }) as T;
  return wrapped;
}
