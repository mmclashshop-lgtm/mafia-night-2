import { PlayerId } from './ids';

export type Token = string;

export interface AuthPayload {
  userId: PlayerId;
  token: Token;
}

export interface ReconnectPayload {
  userId: PlayerId;
  roomCode: string;
  reconnectToken: string;
}
