import { useGameStore } from '../../store/gameStore';
import { TEAM_COLORS } from '@mafia/shared';

export function SpectatorOverlay() {
  const gameState = useGameStore((s) => s.gameState);
  const players = gameState?.players ?? [];

  return (
    <div className="card p-4 border-purple-800/50 bg-purple-950/20">
      <h3 className="text-sm font-bold text-purple-400 mb-3">👁️ Spectator View</h3>
      <div className="space-y-2">
        {players.filter(p => p.alive).map((player) => (
          <div key={player.id} className="flex items-center justify-between text-sm">
            <span>{player.name}</span>
            {player.role && (
              <span
                className="text-xs font-medium"
                style={{ color: TEAM_COLORS[player.team] ?? '#9ca3af' }}
              >
                {player.role.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
