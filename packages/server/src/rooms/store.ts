import { RoomId } from '@mafia/shared';
import { RoomManager } from './manager';

class RoomStore {
  private rooms = new Map<RoomId, RoomManager>();

  get(id: RoomId): RoomManager | undefined {
    return this.rooms.get(id);
  }

  set(id: RoomId, manager: RoomManager): void {
    this.rooms.set(id, manager);
  }

  delete(id: RoomId): boolean {
    const manager = this.rooms.get(id);
    if (manager) {
      manager.destroy();
      return this.rooms.delete(id);
    }
    return false;
  }

  has(id: RoomId): boolean {
    return this.rooms.has(id);
  }

  get size(): number {
    return this.rooms.size;
  }

  getAll(): RoomManager[] {
    return Array.from(this.rooms.values());
  }

  cleanupInactiveRooms(): number {
    let cleaned = 0;
    for (const [id, manager] of this.rooms) {
      if (manager.isInactive()) {
        this.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export const roomStore = new RoomStore();
