import { randomUUID } from 'crypto';
import { Token, PlayerId } from '@mafia/shared';

const tokenStore = new Map<PlayerId, Token>();

export function generateToken(): Token {
  return randomUUID();
}

export function storeToken(userId: PlayerId, token: Token): void {
  tokenStore.set(userId, token);
}

export function verifyToken(userId: PlayerId, token: Token): boolean {
  const stored = tokenStore.get(userId);
  if (!stored) return false;
  return stored === token;
}

export function removeToken(userId: PlayerId): void {
  tokenStore.delete(userId);
}

export function refreshToken(userId: PlayerId): Token {
  const token = generateToken();
  storeToken(userId, token);
  return token;
}
