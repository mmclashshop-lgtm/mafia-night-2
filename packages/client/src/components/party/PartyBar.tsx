import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSocialStore } from '../../store/socialStore';
import { useGameStore } from '../../store/gameStore';
import { getSocket } from '../../lib/socket';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Users, LogOut, Check, X, UserPlus, Play, Loader2 } from 'lucide-react';

export function PartyBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { party, partyInvites, setParty, removePartyInvite } = useSocialStore();
  const playerName = useGameStore((s) => s.playerName);
  const playerId = useGameStore((s) => s.playerId);
  const [joining, setJoining] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const resetSearch = () => setSearching(false);
    socket.on('matchmaking:update', resetSearch);
    socket.on('room:created', resetSearch);
    return () => { socket.off('matchmaking:update', resetSearch); socket.off('room:created', resetSearch); };
  }, []);

  const isHome = location.pathname === '/';
  const isGame = location.pathname === '/game';
  if (isGame) return null;

  const handleCreateParty = () => {
    setCreating(true);
    getSocket().emit('party:create', (res: { success: boolean; partyId?: string }) => {
      if (res.success && res.partyId) {
        setParty([{ userId: playerId ?? '', name: playerName ?? 'Unknown', avatar: 'dicebear', isLeader: true, ready: false }], res.partyId);
      }
      setCreating(false);
    });
  };

  const handleJoinParty = (invitePartyId: string) => {
    setJoining(invitePartyId);
    getSocket().emit('party:join', { partyId: invitePartyId }, (res: { success: boolean }) => {
      if (res.success) {
        setParty([{ userId: playerId ?? '', name: playerName ?? 'Unknown', avatar: 'dicebear', isLeader: false, ready: false }], invitePartyId);
      }
      removePartyInvite(invitePartyId);
      setJoining(null);
    });
  };

  const handleDeclineInvite = (invitePartyId: string) => {
    removePartyInvite(invitePartyId);
  };

  const handleLeaveParty = () => {
    getSocket().emit('party:leave');
    setParty(null, null);
  };

  // Show party invites as a bar
  if (partyInvites.length > 0 && !party) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
        {partyInvites.map((inv) => (
          <div key={inv.partyId} className="card p-3 mb-2 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#8B0000]" />
              <span className="text-sm text-white">{inv.fromName} {t('party.invitedYou')}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleJoinParty(inv.partyId)}
                disabled={joining === inv.partyId}
                className="text-xs px-3 py-1.5 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
              >
                {joining === inv.partyId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleDeclineInvite(inv.partyId)}
                className="text-xs px-3 py-1.5 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No party — show create button as a card
  if (!party) {
    return (
      <div className="card p-3">
        <button
          onClick={handleCreateParty}
          disabled={creating}
          className="w-full btn-secondary flex items-center justify-center gap-2 text-sm py-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {t('party.create')}
        </button>
      </div>
    );
  }

  // Active party
  return (
    <div className="card p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#8B0000]" />
          {t('party.title')}
        </h3>
        <div className="flex items-center gap-2">
          {party.some(m => m.isLeader) && (
            <button
              onClick={() => { setSearching(true); getSocket().emit('party:startSearch'); }}
              disabled={searching}
              className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 disabled:opacity-50"
              title={searching ? t('party.searching') : t('party.startSearch')}
            >
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={handleLeaveParty}
            className="text-xs px-2 py-1 rounded text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {party.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs bg-white/5"
          >
            <PlayerAvatar avatar={member.avatar} name={member.name} size="sm" />
            <span className="text-white whitespace-nowrap">
              {member.name}
              {member.isLeader ? ` (${t('party.leader')})` : ''}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${member.ready ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
