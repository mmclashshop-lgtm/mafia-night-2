import fs from 'fs';
import { usersFile, enqueueWrite } from './io';
import type { StoredUser } from './types';
import { getOrCreatePlayerProfile } from './profiles';

function readUsers(): Map<string, StoredUser> {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf-8');
      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // File might be corrupted
  }
  return new Map();
}

function writeUsers(users: Map<string, StoredUser>): void {
  enqueueWrite(() => {
    const obj: Record<string, StoredUser> = {};
    for (const [key, val] of users) {
      obj[key] = val;
    }
    const tmp = usersFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, usersFile);
  });
}

export function getOrCreateUser(userId: string, name: string): StoredUser {
  const users = readUsers();
  let user = users.get(userId);
  if (!user) {
    user = { userId, name, avatar: 'dicebear', createdAt: Date.now(), lastLoginAt: Date.now() };
    users.set(userId, user);
    writeUsers(users);
    getOrCreatePlayerProfile(userId, name);
  } else {
    user.lastLoginAt = Date.now();
    user.name = name;
    users.set(userId, user);
    writeUsers(users);
  }
  return user;
}

export function getUser(userId: string): StoredUser | null {
  const users = readUsers();
  return users.get(userId) ?? null;
}
