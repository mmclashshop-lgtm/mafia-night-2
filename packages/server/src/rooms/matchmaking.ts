import { Server } from 'socket.io';
import { RoomId, GameState, MIN_PLAYERS, DEFAULT_ELO, getEloRange } from '@mafia/shared';
import { RoomManager } from './manager';
import { roomStore } from './store';
import { getPlayerProfile } from '../db';

interface QueuedPlayer {
  socketId: string;
  name: string;
  elo: number;
  mode: string;
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

  enqueue(socketId: string, name: string, mode = 'casual'): { success: boolean; error?: string } {
    if (this.queue.find((p) => p.socketId === socketId)) {
      return { success: false, error: 'Already in queue' };
    }
    const profile = getPlayerProfile(name);
    const elo = profile?.elo?.[mode] ?? DEFAULT_ELO;
    this.queue.push({ socketId, name, elo, mode });
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

  private findBestMatch(): QueuedPlayer[] | null {
    if (this.queue.length < MIN_PLAYERS) return null;

    // Sort by ELO for proximity matching
    const sorted = [...this.queue].sort((a, b) => b.elo - a.elo);
    const byMode = new Map<string, QueuedPlayer[]>();
    for (const p of sorted) {
      const arr = byMode.get(p.mode) ?? [];
      arr.push(p);
      byMode.set(p.mode, arr);
    }

    // Try each mode group, largest first
    const sortedModes = [...byMode.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [, players] of sortedModes) {
      if (players.length < MIN_PLAYERS) continue;

      // Try ELO-sorted batch
      const batch = players.slice(0, MIN_PLAYERS);
      const elos = batch.map(p => p.elo);
      const range = getEloRange(elos[0] ?? DEFAULT_ELO);
      const inRange = batch.filter(p => p.elo >= range.min && p.elo <= range.max);
      if (inRange.length >= MIN_PLAYERS) return inRange;
    }

    // Fallback: FIFO
    return this.queue.slice(0, MIN_PLAYERS);
  }

  private checkQueue(): void {
    if (!this.io || this.queue.length < MIN_PLAYERS) return;

    const bestMatch = this.findBestMatch();
    if (!bestMatch) return;

    // Remove matched players
    const matchedIds = new Set(bestMatch.map(p => p.socketId));
    this.queue = this.queue.filter(p => !matchedIds.has(p.socketId));

    const validPlayers = bestMatch.filter((p) => {
      const socket = this.io!.sockets.sockets.get(p.socketId);
      return socket?.connected;
    });

    if (validPlayers.length < MIN_PLAYERS) {
      this.queue.unshift(...bestMatch);
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
      const remaining = validPlayers.filter(
        (p) => !addedPlayers.find((ap) => ap.socketId === p.socketId)
      );
      this.queue.unshift(...remaining);
    }
  }
}

export const matchmakingQueue = new MatchmakingQueue();
