import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Friend {
  userId: string;
  name: string;
  avatar: string;
  status: 'online' | 'in_game' | 'idle' | 'offline';
  lastActiveAt: number;
  elo: number;
  level: number;
}

interface PartyMember {
  userId: string;
  name: string;
  avatar: string;
  isLeader: boolean;
  ready: boolean;
}

interface SocialState {
  friends: Friend[];
  friendRequests: Array<{ fromUserId: string; fromName: string; fromAvatar: string }>;
  party: PartyMember[] | null;
  partyId: string | null;
  partyInvites: Array<{ partyId: string; fromName: string }>;
}

interface SocialActions {
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (userId: string) => void;
  addFriendRequest: (request: { fromUserId: string; fromName: string; fromAvatar: string }) => void;
  removeFriendRequest: (fromUserId: string) => void;
  updateFriendStatus: (userId: string, status: Friend['status']) => void;
  setParty: (party: PartyMember[] | null, partyId?: string | null) => void;
  addPartyMember: (member: PartyMember) => void;
  removePartyMember: (userId: string) => void;
  updatePartyMemberReady: (userId: string, ready: boolean) => void;
  addPartyInvite: (invite: { partyId: string; fromName: string }) => void;
  removePartyInvite: (partyId: string) => void;
}

export const useSocialStore = create<SocialState & SocialActions>()(
  devtools(
    (set): SocialState & SocialActions => ({
      friends: [],
      friendRequests: [],
      party: null,
      partyId: null,
      partyInvites: [],

      setFriends: (friends) => set({ friends }),

      addFriend: (friend) =>
        set((state) => ({
          friends: [...state.friends.filter((f) => f.userId !== friend.userId), friend],
        })),

      removeFriend: (userId) =>
        set((state) => ({
          friends: state.friends.filter((f) => f.userId !== userId),
        })),

      addFriendRequest: (request) =>
        set((state) => ({
          friendRequests: [...state.friendRequests, request],
        })),

      removeFriendRequest: (fromUserId) =>
        set((state) => ({
          friendRequests: state.friendRequests.filter((r) => r.fromUserId !== fromUserId),
        })),

      updateFriendStatus: (userId, status) =>
        set((state) => ({
          friends: state.friends.map((f) =>
            f.userId === userId ? { ...f, status } : f
          ),
        })),

      setParty: (party, partyId = null) =>
        set({ party, partyId }),

      addPartyMember: (member) =>
        set((state) => ({
          party: state.party ? [...state.party, member] : [member],
        })),

      removePartyMember: (userId) =>
        set((state) => ({
          party: state.party ? state.party.filter((m) => m.userId !== userId) : null,
        })),

      updatePartyMemberReady: (userId, ready) =>
        set((state) => ({
          party: state.party
            ? state.party.map((m) => (m.userId === userId ? { ...m, ready } : m))
            : null,
        })),

      addPartyInvite: (invite) =>
        set((state) => ({
          partyInvites: [...state.partyInvites, invite],
        })),

      removePartyInvite: (partyId) =>
        set((state) => ({
          partyInvites: state.partyInvites.filter((i) => i.partyId !== partyId),
        })),
    })
  )
);
