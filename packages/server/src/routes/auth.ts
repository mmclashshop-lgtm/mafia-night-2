import { Router } from 'express';
import { getOrCreateUser, getUser, getPlayerProfileByUserId } from '../db/index.js';
import { generateId } from '@mafia/shared';
import { z } from 'zod';

const authNameSchema = z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9_\u0600-\u06FF ]+$/);

export const authRoutes = Router();

authRoutes.post('/auth/guest', (req, res) => {
  const { name } = req.body;
  const parsed = authNameSchema.safeParse(name);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid name. Use letters, numbers, spaces, or Arabic characters.' });
    return;
  }
  const cleanName = parsed.data;
  const userId = generateId('u_');
  const user = getOrCreateUser(userId, cleanName);
  const profile = getPlayerProfileByUserId(userId);
  res.json({ userId: user.userId, name: cleanName, avatar: user.avatar, profile });
});

authRoutes.post('/auth/reconnect', (req, res) => {
  const { userId, name } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const user = getUser(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const displayName = name ? (authNameSchema.safeParse(name).data ?? user.name) : user.name;
  const updated = getOrCreateUser(userId, displayName);
  const profile = getPlayerProfileByUserId(userId);
  res.json({ userId: updated.userId, name: displayName, avatar: updated.avatar, profile });
});

function verifyGoogleToken(token: string): Promise<{ sub: string; name: string; picture: string } | null> {
  return fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
    .then(r => r.ok ? r.json() : null)
    .then(data => data?.sub ? { sub: data.sub, name: data.name || 'User', picture: data.picture || '' } : null)
    .catch(() => null);
}

function verifyFacebookToken(accessToken: string, userId: string): Promise<{ name: string; picture: string } | null> {
  return fetch(`https://graph.facebook.com/v19.0/${userId}?fields=name,picture&access_token=${accessToken}`)
    .then(r => r.ok ? r.json() : null)
    .then(data => data?.name ? { name: data.name, picture: data.picture?.data?.url || '' } : null)
    .catch(() => null);
}

authRoutes.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: 'Missing credential' });
    return;
  }
  const payload = await verifyGoogleToken(credential);
  if (!payload) {
    res.status(401).json({ error: 'Invalid Google token' });
    return;
  }
  const oauthId = `google:${payload.sub}`;
  let user = getUser(oauthId);
  if (!user) {
    user = getOrCreateUser(oauthId, payload.name);
  }
  const profile = getPlayerProfileByUserId(oauthId);
  res.json({ userId: user.userId, name: payload.name, avatar: payload.picture || user.avatar, profile });
});

authRoutes.post('/auth/facebook', async (req, res) => {
  const { accessToken, userId: fbUserId, name: fbName, avatar: fbAvatar } = req.body;
  if (!accessToken || !fbUserId) {
    res.status(400).json({ error: 'Missing access token or user ID' });
    return;
  }
  const payload = await verifyFacebookToken(accessToken, fbUserId);
  if (!payload) {
    res.status(401).json({ error: 'Invalid Facebook token' });
    return;
  }
  const oauthId = `facebook:${fbUserId}`;
  const displayName = fbName || payload.name;
  let user = getUser(oauthId);
  if (!user) {
    user = getOrCreateUser(oauthId, displayName);
  }
  const profile = getPlayerProfileByUserId(oauthId);
  res.json({ userId: user.userId, name: displayName, avatar: fbAvatar || payload.picture || user.avatar, profile });
});
