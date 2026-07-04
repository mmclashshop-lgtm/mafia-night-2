import { useEffect } from 'react';
import { sound } from '../lib/sound';
import { getSocket } from '../lib/socket';

export function useSocialSound() {
  useEffect(() => {
    const socket = getSocket();

    const onFriendRequest = () => {
      sound.friendRequest();
    };

    const onFriendOnline = () => {
      sound.friendOnline();
    };

    const onPartyInvite = () => {
      sound.partyInvite();
    };

    const onPartyJoined = () => {
      sound.notification();
    };

    const onPartyLeft = () => {
      sound.error();
    };

    socket.on('friend:request', onFriendRequest);
    socket.on('friend:online', onFriendOnline);
    socket.on('friend:request-accepted', onFriendOnline);
    socket.on('party:invite', onPartyInvite);
    socket.on('party:member-joined', onPartyJoined);
    socket.on('party:member-left', onPartyLeft);

    return () => {
      socket.off('friend:request', onFriendRequest);
      socket.off('friend:online', onFriendOnline);
      socket.off('friend:request-accepted', onFriendOnline);
      socket.off('party:invite', onPartyInvite);
      socket.off('party:member-joined', onPartyJoined);
      socket.off('party:member-left', onPartyLeft);
    };
  }, []);
}
