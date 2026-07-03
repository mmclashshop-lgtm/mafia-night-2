import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { useSocialStore } from '../store/socialStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

export function useSocialSocket() {
  const { userId } = useAuthStore();
  const { addToast } = useUIStore();

  const {
    addFriend,
    removeFriend,
    addFriendRequest,
    removeFriendRequest,
    updateFriendStatus,
    setParty,
    addPartyMember,
    removePartyMember,
    updatePartyMemberReady,
    addPartyInvite,
    removePartyInvite,
  } = useSocialStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;

    const onRequest = (data: { fromUserId: string; fromName: string; fromAvatar: string }) => {
      addFriendRequest(data);
      addToast('info', `${data.fromName} sent you a friend request`);
    };

    const onAccepted = (data: { userId: string; name: string; avatar: string }) => {
      removeFriendRequest(data.userId);
      addFriend({ userId: data.userId, name: data.name, avatar: data.avatar, status: 'online', lastActiveAt: Date.now(), elo: 1000, level: 1 });
      addToast('success', `${data.name} accepted your friend request`);
    };

    const onRejected = (data: { userId: string }) => {
      removeFriendRequest(data.userId);
    };

    const onRemoved = (data: { userId: string }) => {
      removeFriend(data.userId);
      addToast('info', 'You have been removed from friends');
    };

    const onOnline = (data: { userId: string; status: 'online' | 'in_game' | 'idle' | 'offline' }) => {
      updateFriendStatus(data.userId, data.status);
    };

    const onInvite = (data: { partyId: string; fromName: string }) => {
      addPartyInvite(data);
      addToast('info', `${data.fromName} invited you to a party`);
    };

    const onCreated = (data: { partyId: string; members: Array<{ userId: string; name: string; avatar: string; isLeader: boolean; ready: boolean }> }) => {
      setParty(data.members, data.partyId);
    };

    const onJoined = (data: { partyId: string; member: { userId: string; name: string; avatar: string; isLeader: boolean; ready: boolean } }) => {
      setParty(null);
      addPartyMember(data.member);
    };

    const onLeft = (data: { userId: string }) => {
      removePartyMember(data.userId);
    };

    const onReady = (data: { userId: string; ready: boolean }) => {
      updatePartyMemberReady(data.userId, data.ready);
    };

    const onDisbanded = () => {
      setParty(null, null);
    };

    socket.on('friend:request', onRequest);
    socket.on('friend:request-accepted', onAccepted);
    socket.on('friend:request-rejected', onRejected);
    socket.on('friend:removed', onRemoved);
    socket.on('friend:online', onOnline);
    socket.on('party:invite', onInvite);
    socket.on('party:created', onCreated);
    socket.on('party:joined', onJoined);
    socket.on('party:member-left', onLeft);
    socket.on('party:member-ready', onReady);
    socket.on('party:disbanded', onDisbanded);

    return () => {
      socket.off('friend:request', onRequest);
      socket.off('friend:request-accepted', onAccepted);
      socket.off('friend:request-rejected', onRejected);
      socket.off('friend:removed', onRemoved);
      socket.off('friend:online', onOnline);
      socket.off('party:invite', onInvite);
      socket.off('party:created', onCreated);
      socket.off('party:joined', onJoined);
      socket.off('party:member-left', onLeft);
      socket.off('party:member-ready', onReady);
      socket.off('party:disbanded', onDisbanded);
    };
  }, [userId]);
}
