import { useTranslation } from 'react-i18next';
import { Player, Phase, TEAM_COLORS } from '@mafia/shared';
import { cn } from '../../lib/utils';
import { RoleAvatar } from '../common/RoleAvatar';
import { PlayerAvatar } from '../common/PlayerAvatar';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  phase: Phase;
  isDead?: boolean;
  onAction?: () => void;
}

export function PlayerCard({ player, isCurrentPlayer, phase, isDead = false, onAction }: PlayerCardProps) {
  const { t } = useTranslation();
  const isNightActionPhase = phase === 'night';
  const isVotingPhase = phase === 'voting';
  const canInteract = (isNightActionPhase || isVotingPhase) && player.alive && !isCurrentPlayer && !isDead;

  return (
    <button
      onClick={canInteract ? onAction : undefined}
      disabled={!canInteract}
      className={cn(
        'card p-3 text-center transition-all duration-200 card-shine',
        canInteract && 'hover:border-gray-600 hover:bg-gray-800/50 cursor-pointer active:scale-95',
        isCurrentPlayer && 'ring-2 ring-red-700',
        !player.alive && 'opacity-40 grayscale',
        player.disconnected && 'opacity-50',
        player.votedFor && 'ring-1 ring-yellow-500'
      )}
    >
      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden"
        style={{
          border: `2px solid ${player.role ? TEAM_COLORS[player.team] : '#374151'}40`,
        }}
      >
        {player.role ? (
          <RoleAvatar roleId={player.role.id} size="md" />
        ) : (
          <PlayerAvatar avatar={player.avatar} name={player.name} size="sm" />
        )}
      </div>
      <p className="text-sm font-medium truncate">{player.name}</p>
      {player.role && (
        <p className="text-xs mt-0.5" style={{ color: TEAM_COLORS[player.team] }}>
          {player.role.emoji} {player.role.name}
        </p>
      )}
      {!player.alive && <p className="text-xs text-red-400 mt-0.5">{t('playerCard.dead')}</p>}
      {player.disconnected && <p className="text-xs text-yellow-400 mt-0.5">{t('playerCard.disconnected')}</p>}
      {isDead && player.role && (
        <p className="text-xs mt-0.5" style={{ color: TEAM_COLORS[player.team] }}>{player.team}</p>
      )}
    </button>
  );
}
