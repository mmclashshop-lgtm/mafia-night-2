export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';
export type OnlineStatus = 'online' | 'in_game' | 'idle' | 'offline';

export interface FriendProfile {
  userId: string;
  name: string;
  avatar: string;
  status: OnlineStatus;
  lastActiveAt: number;
  elo: number;
  level: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  fromAvatar: string;
  toUserId: string;
  createdAt: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PartyMember {
  userId: string;
  name: string;
  avatar: string;
  isLeader: boolean;
  ready: boolean;
}

export interface Party {
  id: string;
  leaderUserId: string;
  members: PartyMember[];
  createdAt: number;
}
