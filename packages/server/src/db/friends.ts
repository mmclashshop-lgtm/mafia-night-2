import { readProfiles, writeProfiles, getProfileByUserId } from './profiles';
import { getUser } from './users';
import type { FriendProfile } from './types';
import { DEFAULT_ELO } from '@mafia/shared';

export function sendFriendRequest(fromUserId: string, toUserId: string): boolean {
  const profiles = readProfiles();
  const fromProfile = getProfileByUserId(profiles, fromUserId);
  const toProfile = getProfileByUserId(profiles, toUserId);
  if (!fromProfile || !toProfile) return false;
  if (toProfile.pendingFriendRequests.includes(fromUserId)) return false;
  if (fromProfile.friendUserIds.includes(toUserId)) return false;
  toProfile.pendingFriendRequests.push(fromUserId);
  profiles.set(toProfile.name, toProfile);
  writeProfiles(profiles);
  return true;
}

export function acceptFriendRequest(userId: string, fromUserId: string): boolean {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  const fromProfile = getProfileByUserId(profiles, fromUserId);
  if (!userProfile || !fromProfile) return false;
  const idx = userProfile.pendingFriendRequests.indexOf(fromUserId);
  if (idx === -1) return false;
  userProfile.pendingFriendRequests.splice(idx, 1);
  if (!userProfile.friendUserIds.includes(fromUserId)) userProfile.friendUserIds.push(fromUserId);
  if (!fromProfile.friendUserIds.includes(userId)) fromProfile.friendUserIds.push(userId);
  profiles.set(userProfile.name, userProfile);
  profiles.set(fromProfile.name, fromProfile);
  writeProfiles(profiles);
  return true;
}

export function rejectFriendRequest(userId: string, fromUserId: string): boolean {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  if (!userProfile) return false;
  const idx = userProfile.pendingFriendRequests.indexOf(fromUserId);
  if (idx === -1) return false;
  userProfile.pendingFriendRequests.splice(idx, 1);
  profiles.set(userProfile.name, userProfile);
  writeProfiles(profiles);
  return true;
}

export function removeFriend(userId: string, targetUserId: string): boolean {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  const targetProfile = getProfileByUserId(profiles, targetUserId);
  if (!userProfile || !targetProfile) return false;
  const idx1 = userProfile.friendUserIds.indexOf(targetUserId);
  if (idx1 !== -1) userProfile.friendUserIds.splice(idx1, 1);
  const idx2 = targetProfile.friendUserIds.indexOf(userId);
  if (idx2 !== -1) targetProfile.friendUserIds.splice(idx2, 1);
  profiles.set(userProfile.name, userProfile);
  if (targetProfile.name !== userProfile.name) profiles.set(targetProfile.name, targetProfile);
  writeProfiles(profiles);
  return true;
}

export function getFriendProfiles(userId: string): FriendProfile[] {
  const profiles = readProfiles();
  const userProfile = getProfileByUserId(profiles, userId);
  if (!userProfile) return [];
  return userProfile.friendUserIds
    .map(fid => {
      const fp = getProfileByUserId(profiles, fid);
      if (!fp) return null;
      const user = getUser(fid);
      return { userId: fid, name: fp.name, avatar: user?.avatar ?? 'dicebear', elo: fp.elo['competitive'] ?? DEFAULT_ELO, level: fp.level };
    })
    .filter(Boolean) as FriendProfile[];
}
