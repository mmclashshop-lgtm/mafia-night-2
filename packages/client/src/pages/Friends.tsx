import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/common/PageTransition';
import { useSocialStore } from '../store/socialStore';
import { getSocket } from '../lib/socket';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { EmptyState } from '../components/common/EmptyState';
import { ArrowLeft, UserPlus, Users, MessageCircle, Search, X, Check, Loader2, UserCheck } from 'lucide-react';

export function Friends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { friends, friendRequests, setFriends, removeFriend, removeFriendRequest, addFriend } = useSocialStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ userId: string; name: string; avatar: string }> | null>(null);

  useEffect(() => {
    fetch(`/api/friends`)
      .then((res) => res.json())
      .then((data) => {
        setFriends(data.map((f: any) => ({ ...f, status: 'offline' as const, lastActiveAt: Date.now(), elo: 1000, level: 1 })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setFriends]);

  const handleAccept = (fromUserId: string) => {
    getSocket().emit('friend:accept', { userId: fromUserId });
    removeFriendRequest(fromUserId);
  };

  const handleReject = (fromUserId: string) => {
    getSocket().emit('friend:reject', { userId: fromUserId });
    removeFriendRequest(fromUserId);
  };

  const handleRemoveFriend = (friendUserId: string) => {
    getSocket().emit('friend:remove', { userId: friendUserId });
    removeFriend(friendUserId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/stats/player/${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults([{ userId: data.userId, name: data.name, avatar: data.avatar ?? '' }]);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = (targetUserId: string, targetName: string) => {
    getSocket().emit('friend:request', { userId: targetUserId, toName: targetName });
    setSearchResults(null);
    setSearchQuery('');
  };

  const onlineFriends = friends.filter((f) => f.status === 'online' || f.status === 'in_game');
  const offlineFriends = friends.filter((f) => f.status === 'offline');

  return (
    <PageTransition>
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#8B0000]" />
            {t('friends.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {friends.length} {t('friends.total')}
          </p>
        </div>
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('friends.back')}
        </button>
      </div>

      {/* Add Friend Search */}
      <div className="card-glass p-4 card-shine">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5" />
          {t('friends.addFriend')}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('friends.searchPlaceholder')}
            className="input flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="btn-primary px-3"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
        {searchResults !== null && (
          <div className="mt-2 space-y-1">
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">{t('friends.noResults')}</p>
            ) : (
              searchResults.map((r) => (
                <div key={r.userId} className="card-hover flex items-center justify-between p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar avatar={r.avatar} name={r.name} size="sm" />
                    <span className="text-sm text-white">{r.name}</span>
                  </div>
                  <button
                    onClick={() => handleAddFriend(r.userId, r.name)}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {t('friends.add')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="card-glass p-4">
          <h2 className="section-title mb-3 flex items-center gap-2 text-green-400">
            <UserPlus className="w-3.5 h-3.5" />
            {t('friends.pendingRequests')} ({friendRequests.length})
          </h2>
          <div className="space-y-2">
            {friendRequests.map((req) => (
              <div key={req.fromUserId} className="card-hover flex items-center justify-between p-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <PlayerAvatar avatar={req.fromAvatar} name={req.fromName} size="sm" />
                  <span className="text-sm text-white">{req.fromName}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.fromUserId)}
                    className="text-xs px-3 py-1 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleReject(req.fromUserId)}
                    className="text-xs px-3 py-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div className="card-glass p-4">
          <h2 className="section-title mb-3 text-green-400">
            {t('friends.online')} ({onlineFriends.length})
          </h2>
          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <div key={friend.userId} className="card-hover flex items-center justify-between p-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <PlayerAvatar avatar={friend.avatar} name={friend.name} size="sm" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                      friend.status === 'online' ? 'status-dot-online' : 'status-dot-ingame'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{friend.name}</p>
                    <p className="text-xs text-gray-500">
                      {friend.status === 'in_game' ? t('friends.inGame') : t('friends.online')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => getSocket().emit('party:invite', { targetUserId: friend.userId })}
                    className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
                    title={t('friends.invite')}
                  >
                    <UserCheck className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveFriend(friend.userId)}
                    className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading / Empty */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-[#8B0000] border-t-transparent rounded-full" />
        </div>
      ) : friends.length === 0 && friendRequests.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-gray-500" />}
          title={t('friends.noFriends')}
          description={t('friends.noFriendsDesc')}
        />
      ) : null}

      {/* Offline Friends */}
      {offlineFriends.length > 0 && (
        <div className="card-glass p-4">
          <h2 className="section-title mb-3 text-gray-500">
            {t('friends.offline')} ({offlineFriends.length})
          </h2>
          <div className="space-y-2">
            {offlineFriends.map((friend) => (
              <div key={friend.userId} className="flex items-center justify-between p-2 rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <PlayerAvatar avatar={friend.avatar} name={friend.name} size="sm" />
                  <div>
                    <p className="text-sm text-gray-400">{friend.name}</p>
                    <p className="text-xs text-gray-600">{t('friends.offline')}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend.userId)}
                  className="text-xs px-2 py-1 rounded bg-white/5 text-gray-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
