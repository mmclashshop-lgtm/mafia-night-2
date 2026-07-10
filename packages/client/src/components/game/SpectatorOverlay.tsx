import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { TEAM_COLORS } from '@mafia/shared';

export function SpectatorOverlay() {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const players = gameState?.players ?? [];

  return (
    <div className="card-glass p-4 border-purple-800/30">
      <h3 className="section-title text-sm mb-3 text-purple-400">{t('spectatorOverlay.title')}</h3>
      <div className="space-y-1.5">
        {players.filter(p => p.alive).map((player) => (
          <div key={player.id} className="flex items-center justify-between text-sm py-1 px-2 rounded-lg hover:bg-white/[0.03]">
            <span className="text-gray-300">{player.name}</span>
            <span
              className="text-[11px] font-medium"
              style={{ color: TEAM_COLORS[player.team] ?? '#9ca3af' }}
            >
              {t('spectatorOverlay.alive')}
            </span>
          </div>
        ))}
        {players.filter(p => !p.alive).length > 0 && (
          <>
            <div className="border-t border-white/5 pt-2 mt-2" />
            {players.filter(p => !p.alive).map((player) => (
              <div key={player.id} className="flex items-center justify-between text-sm py-1 px-2 rounded-lg opacity-60">
                <span className="text-gray-400">{player.name}</span>
                <span className="text-[11px] text-red-400">{t('spectatorOverlay.dead')}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
