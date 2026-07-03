import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, getFriendProfiles } from '../../db';
import { getUser } from '../../db';

interface PartyMember {
  userId: string;
  name: string;
  avatar: string;
  isLeader: boolean;
  ready: boolean;
}

interface Party {
  id: string;
  leaderUserId: string;
  members: PartyMember[];
  createdAt: number;
}

const parties = new Map<string, Party>();

function generatePartyId(): string {
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function getUserSocket(io: Server, userId: string): Socket | undefined {
  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    if (socket.data.userId === userId) return socket;
  }
  return undefined;
}

function getPartyByUserId(userId: string): Party | undefined {
  for (const [, party] of parties) {
    if (party.members.some(m => m.userId === userId)) return party;
  }
  return undefined;
}

export function registerSocialHandlers(io: Server, socket: Socket): void {
  // Friend: send request
  socket.on('friend:request', async (data: { userId: string; toName?: string }, callback) => {
    const fromUserId = socket.data.userId;
    if (!fromUserId) {
      callback?.({ success: false, error: 'Not authenticated' });
      return;
    }
    const success = sendFriendRequest(fromUserId, data.userId);
    if (success) {
      const targetSocket = getUserSocket(io, data.userId);
      if (targetSocket) {
        targetSocket.emit('friend:request', {
          fromUserId,
          fromName: socket.data.name ?? 'Unknown',
          fromAvatar: socket.data.avatar ?? 'dicebear',
        });
      }
    }
    callback?.({ success, error: success ? undefined : 'Failed to send request' });
  });

  // Friend: accept request
  socket.on('friend:accept', async (data: { userId: string }, callback) => {
    const userId = socket.data.userId;
    if (!userId) {
      callback?.({ success: false, error: 'Not authenticated' });
      return;
    }
    const success = acceptFriendRequest(userId, data.userId);
    if (success) {
      // Notify the requester that their request was accepted
      const requesterSocket = getUserSocket(io, data.userId);
      if (requesterSocket) {
        requesterSocket.emit('friend:request-accepted', {
          userId,
          name: socket.data.name ?? 'Unknown',
          avatar: socket.data.avatar ?? 'dicebear',
        });
      }
    }
    callback?.({ success, error: success ? undefined : 'Failed to accept request' });
  });

  // Friend: reject request
  socket.on('friend:reject', (data: { userId: string }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const success = rejectFriendRequest(userId, data.userId);
    if (success) {
      const requesterSocket = getUserSocket(io, data.userId);
      if (requesterSocket) {
        requesterSocket.emit('friend:request-rejected', { userId });
      }
    }
  });

  // Friend: remove
  socket.on('friend:remove', (data: { userId: string }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    removeFriend(userId, data.userId);
    const removedSocket = getUserSocket(io, data.userId);
    if (removedSocket) {
      removedSocket.emit('friend:removed', { userId });
    }
  });

  // Party: create
  socket.on('party:create', (callback) => {
    const userId = socket.data.userId;
    const name = socket.data.name ?? 'Unknown';
    const avatar = socket.data.avatar ?? 'dicebear';
    if (!userId) {
      callback?.({ success: false });
      return;
    }
    const existing = getPartyByUserId(userId);
    if (existing) {
      callback?.({ success: false, partyId: existing.id });
      return;
    }
    const party: Party = {
      id: generatePartyId(),
      leaderUserId: userId,
      members: [{ userId, name, avatar, isLeader: true, ready: false }],
      createdAt: Date.now(),
    };
    parties.set(party.id, party);
    callback?.({ success: true, partyId: party.id });
  });

  // Party: invite
  socket.on('party:invite', (data: { targetUserId: string }) => {
    const fromUserId = socket.data.userId;
    const fromName = socket.data.name ?? 'Unknown';
    if (!fromUserId) return;
    const party = getPartyByUserId(fromUserId);
    if (!party || party.leaderUserId !== fromUserId) return;

    const targetSocket = getUserSocket(io, data.targetUserId);
    if (targetSocket) {
      targetSocket.emit('party:invite', {
        partyId: party.id,
        fromName,
      });
    }
  });

  // Party: join
  socket.on('party:join', (data: { partyId: string }, callback) => {
    const userId = socket.data.userId;
    const name = socket.data.name ?? 'Unknown';
    const avatar = socket.data.avatar ?? 'dicebear';
    if (!userId) {
      callback?.({ success: false });
      return;
    }
    const party = parties.get(data.partyId);
    if (!party || party.members.length >= 6) {
      callback?.({ success: false, error: 'Party full or not found' });
      return;
    }
    party.members.push({ userId, name, avatar, isLeader: false, ready: false });
    party.members.forEach(m => {
      const ms = getUserSocket(io, m.userId);
      if (ms) ms.emit('party:member-joined', { userId, name });
    });
    callback?.({ success: true });
  });

  // Party: leave
  socket.on('party:leave', () => {
    const userId = socket.data.userId;
    if (!userId) return;
    const party = getPartyByUserId(userId);
    if (!party) return;

    party.members = party.members.filter(m => m.userId !== userId);
    if (party.members.length === 0 || party.leaderUserId === userId) {
      if (party.members.length === 0 || !party.members[0]) {
        parties.delete(party.id);
      } else {
        const newLeader = party.members[0];
        party.leaderUserId = newLeader.userId;
        newLeader.isLeader = true;
        party.members.forEach(m => {
          const ms = getUserSocket(io, m.userId);
          if (ms) ms.emit('party:member-left', { userId });
        });
      }
    } else {
      party.members.forEach(m => {
        const ms = getUserSocket(io, m.userId);
        if (ms) ms.emit('party:member-left', { userId });
      });
    }
  });

  // Party: kick
  socket.on('party:kick', (data: { targetUserId: string }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const party = getPartyByUserId(userId);
    if (!party || party.leaderUserId !== userId) return;

    party.members = party.members.filter(m => m.userId !== data.targetUserId);
    party.members.forEach(m => {
      const ms = getUserSocket(io, m.userId);
      if (ms) ms.emit('party:member-left', { userId: data.targetUserId });
    });
    const kickedSocket = getUserSocket(io, data.targetUserId);
    if (kickedSocket) kickedSocket.emit('party:disbanded');
  });

  // Party: start search
  socket.on('party:startSearch', (data: { mode?: string }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    const party = getPartyByUserId(userId);
    if (!party || party.leaderUserId !== userId) return;
    party.members = party.members.map(m => ({ ...m, ready: true }));
    party.members.forEach(m => {
      const ms = getUserSocket(io, m.userId);
      if (ms) ms.emit('party:member-ready', { userId: m.userId, ready: true });
    });
  });

  // Party: cancel search
  socket.on('party:cancelSearch', () => {
    const userId = socket.data.userId;
    if (!userId) return;
    const party = getPartyByUserId(userId);
    if (!party || party.leaderUserId !== userId) return;
    party.members = party.members.map(m => ({ ...m, ready: false }));
    party.members.forEach(m => {
      const ms = getUserSocket(io, m.userId);
      if (ms) ms.emit('party:member-ready', { userId: m.userId, ready: false });
    });
  });
}