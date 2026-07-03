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
