import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocialStore } from '../../store/socialStore';
import { getSocket } from '../../lib/socket';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Users, LogOut, Check, X, UserPlus, Play, Loader2 } from 'lucide-react';

export function PartyBar() {
  const { t } = useTranslation();
  const { party, partyInvites, removePartyInvite } = useSocialStore();
  const [joining, setJoining] = useState<string | null>(null);

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
          onClick={() => getSocket().emit('party:create')}
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
              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs bg-white/5`}
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
    </div>
  );
}
