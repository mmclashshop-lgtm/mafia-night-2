export type PlayerId = string & { readonly __brand: unique symbol };
export type RoomId = string & { readonly __brand: unique symbol };
export type SocketId = string & { readonly __brand: unique symbol };
export type UserId = string & { readonly __brand: unique symbol };

export function createPlayerId(id: string): PlayerId {
  return id as PlayerId;
}

export function createRoomId(id: string): RoomId {
  return id as RoomId;
}

export function createSocketId(id: string): SocketId {
  return id as SocketId;
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export const generateId = (prefix = ''): string => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
};