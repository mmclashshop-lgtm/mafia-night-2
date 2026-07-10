import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, Phase, TEAM_COLORS } from '@mafia/shared';
import { cn } from '../../lib/utils';
import { RoleAvatar } from '../common/RoleAvatar';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { Skull } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  phase: Phase;
  isDead?: boolean;
  onAction?: () => void;
}

export const PlayerCard = memo(function PlayerCard({ player, isCurrentPlayer, phase, isDead = false, onAction }: PlayerCardProps) {
  const { t } = useTranslation();
  const isNightActionPhase = phase === 'night';
  const isVotingPhase = phase === 'voting';
  const canInteract = (isNightActionPhase || isVotingPhase) && player.alive && !isCurrentPlayer && !isDead;
  const showRole = isDead && player.role;

  const teamColor = player.team === 'mafia' ? '#8B0000' : player.team === 'town' ? '#2563EB' : '#9333EA';
  const teamColorLight = player.team === 'mafia' ? 'rgba(139,0,0,0.15)' : player.team === 'town' ? 'rgba(37,99,235,0.15)' : 'rgba(147,51,234,0.15)';

  return (
    <button
      onClick={canInteract ? onAction : undefined}
      disabled={!canInteract}
      className={cn(
        'card relative p-3 text-center transition-all duration-200 overflow-hidden card-shine',
        canInteract && 'hover:border-[#8B0000]/40 cursor-pointer active:scale-[0.97] card-hover',
        isCurrentPlayer && 'ring-2 ring-[#B22222] shadow-[0_0_12px_rgba(139,0,0,0.3)]',
        !player.alive && 'opacity-40',
        player.disconnected && 'opacity-50',
        player.votedFor && 'ring-1 ring-yellow-500/50'
      )}
      style={{
        borderColor: player.alive ? `${teamColor}40` : undefined,
        background: player.alive ? `linear-gradient(180deg, ${teamColorLight} 0%, transparent 100%)` : undefined,
      }}
    >
      {!player.alive && <div className="absolute top-2 left-2"><Skull className="w-3.5 h-3.5 text-red-400" /></div>}

      {player.alive && (
        <div className="absolute bottom-0 left-0 right-0 hp-bar rounded-none">
          <div className={`hp-bar-fill ${player.alive ? 'hp-bar-fill-high' : 'hp-bar-fill-low'}`} style={{ width: '100%' }} />
        </div>
      )}

      <div className="relative inline-block mb-2">
        <div className="w-11 h-11 rounded-full mx-auto flex items-center justify-center overflow-hidden"
          style={{ border: `2px solid ${player.alive ? `${teamColor}60` : '#374151'}` }}
        >
          {showRole ? <RoleAvatar roleId={player.role.id} size="md" /> : <PlayerAvatar avatar={player.avatar} name={player.name} size="sm" />}
        </div>
        {player.votedFor && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-[8px] text-white font-bold">✓</span>
          </span>
        )}
      </div>

      <p className="text-xs font-semibold truncate leading-tight">{player.name}</p>

      {showRole && <p className="text-[10px] mt-0.5 opacity-80" style={{ color: TEAM_COLORS[player.team] }}>{player.role.emoji} {player.role.name}</p>}
      {!player.alive && <p className="text-[10px] text-red-400 mt-0.5">{t('playerCard.dead')}</p>}
      {player.disconnected && <p className="text-[10px] text-yellow-400 mt-0.5">{t('playerCard.disconnected')}</p>}
      {isDead && player.role && <p className="text-[10px] mt-0.5 opacity-60" style={{ color: TEAM_COLORS[player.team] }}>{player.team}</p>}
    </button>
  );
});
