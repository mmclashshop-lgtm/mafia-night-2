import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocialStore } from '../../store/socialStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../lib/socket';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Users, LogOut, Check, X, UserPlus, Play, Loader2 } from 'lucide-react';

export function PartyBar() {
  const { t } = useTranslation();
  const { userId } = useAuthStore();
  const { party, partyId, partyInvites, removePartyInvite } = useSocialStore();
  const [joining, setJoining] = useState<string | null>(null);

  const isLeader = party?.some(m => m.userId === userId && m.isLeader) ?? false;
  const myReady = party?.find(m => m.userId === userId)?.ready ?? false;

  const handleCreateParty = () => {
    getSocket().emit('party:create');
  };

  const handleJoinParty = (invitePartyId: string) => {
    setJoining(invitePartyId);
    getSocket().emit('party:join', { partyId: invitePartyId });
    removePartyInvite(invitePartyId);
    setJoining(null);
  };

  const handleDeclineInvite = (invitePartyId: string) => {
    removePartyInvite(invitePartyId);
  };

  const handleLeaveParty = () => {
    getSocket().emit('party:leave');
  };

  const handleToggleReady = () => {
    getSocket().emit('party:ready', { ready: !myReady });
  };

  const handleStartSearch = () => {
    getSocket().emit('party:startSearch');
  };

  const handleCancelSearch = () => {
    getSocket().emit('party:cancelSearch');
  };

  if (!userId) return null;

  // Show party invites as a bar
  if (partyInvites.length > 0 && !party) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-40 max-w-sm mx-auto">
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

  // No party — show create button
  if (!party) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 z-40">
        <button
          onClick={handleCreateParty}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Users className="w-4 h-4" />
          {t('party.create')}
        </button>
      </div>
    );
  }

  // Active party
  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
      <div className="card p-3 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8B0000]" />
            {t('party.title')}
          </h3>
          <button
            onClick={handleLeaveParty}
            className="text-xs px-2 py-1 rounded text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {party.map((member) => (
            <div
              key={member.userId}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                member.userId === userId ? 'bg-[#8B0000]/20 ring-1 ring-[#8B0000]/30' : 'bg-white/5'
              }`}
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

        <div className="flex gap-2 mt-2">
          {isLeader && (
            <button
              onClick={handleStartSearch}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              {t('party.startSearch')}
            </button>
          )}
          <button
            onClick={handleToggleReady}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              myReady
                ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Check className="w-3 h-3" />
            {myReady ? t('party.ready') : t('party.notReady')}
          </button>
        </div>
      </div>
    </div>
  );
}
