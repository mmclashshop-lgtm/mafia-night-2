import { Server } from 'socket.io';
import { RoomId, GameState, MIN_PLAYERS } from '@mafia/shared';
import { RoomManager } from './manager';
import { roomStore } from './store';

interface QueuedPlayer {
  socketId: string;
  name: string;
}

class MatchmakingQueue {
  private queue: QueuedPlayer[] = [];
  private io: Server | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  init(io: Server): void {
    this.io = io;
    this.checkInterval = setInterval(() => this.checkQueue(), 2000);
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.queue = [];
  }

  enqueue(socketId: string, name: string): { success: boolean; error?: string } {
    if (this.queue.find((p) => p.socketId === socketId)) {
      return { success: false, error: 'Already in queue' };
    }
    this.queue.push({ socketId, name });
    this.broadcastUpdate();
    return { success: true };
  }

  dequeue(socketId: string): void {
    this.queue = this.queue.filter((p) => p.socketId !== socketId);
    this.broadcastUpdate();
  }

  removeBySocket(socketId: string): void {
    this.dequeue(socketId);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  private broadcastUpdate(): void {
    if (!this.io) return;
    const size = this.queue.length;
    for (const player of this.queue) {
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (socket?.connected) {
        socket.emit('matchmaking:update', { queueSize: size });
      }
    }
  }

  private checkQueue(): void {
    if (!this.io || this.queue.length < MIN_PLAYERS) return;

    const batch = this.queue.splice(0, MIN_PLAYERS);
    const validPlayers = batch.filter((p) => {
      const socket = this.io!.sockets.sockets.get(p.socketId);
      return socket?.connected;
    });

    if (validPlayers.length < MIN_PLAYERS) {
      this.queue.unshift(...batch);
      return;
    }

    const room = new RoomManager(this.io);
    roomStore.set(room.code as unknown as RoomId, room);
    const addedPlayers: Array<{ socketId: string; name: string }> = [];

    for (const player of validPlayers) {
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (!socket?.connected) continue;

      socket.join(room.code);
      const result = room.addPlayer(socket, player.name);
      if (result.success) {
        addedPlayers.push({ socketId: player.socketId, name: player.name });
      }
    }

    if (addedPlayers.length >= MIN_PLAYERS) {
      const state = room.stateSnapshot;
      for (const ap of addedPlayers) {
        const socket = this.io.sockets.sockets.get(ap.socketId);
        if (socket?.connected) {
          socket.emit('matchmaking:found', { roomCode: room.code, state });
        }
      }
    } else {
      roomStore.delete(room.code as unknown as RoomId);
      const remaining = [...validPlayers.filter(
        (p) => !addedPlayers.find((ap) => ap.socketId === p.socketId)
      )];
      this.queue.unshift(...remaining);
    }
  }
}

export const matchmakingQueue = new MatchmakingQueue();
