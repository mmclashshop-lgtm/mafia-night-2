import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { useUIStore } from '../store/uiStore';
import { PhaseIndicator } from '../components/game/PhaseIndicator';
import { PlayerCard } from '../components/game/PlayerCard';
import { NightActions } from '../components/game/NightActions';
import { VotingPanel } from '../components/game/VotingPanel';
import { ChatPanel } from '../components/game/ChatPanel';
import { GameLog } from '../components/game/GameLog';
import { RoleCard } from '../components/game/RoleCard';
import { DeathReveal } from '../components/game/DeathReveal';
import { SpectatorOverlay } from '../components/game/SpectatorOverlay';
import { VoiceChat } from '../components/game/VoiceChat';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSound } from '../hooks/useSound';


export function Game() {
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const connected = useGameStore((s) => s.connected);
  const navigate = useNavigate();
  const { leaveRoom, submitNightAction, submitVote, playAgain } = useSocket();
  const { addToast } = useUIStore();
  const [playAgainLoading, setPlayAgainLoading] = useState(false);
  useSound();

  const phase = gameState?.phase ?? 'lobby';
  const players = gameState?.players ?? [];
  const currentPlayer = players.find((p) => p.id === playerId);
  const alivePlayers = players.filter((p) => p.alive);
  const deadPlayers = players.filter((p) => !p.alive);
  const isDead = currentPlayer ? !currentPlayer.alive : false;
  const isNight = phase === 'night';
  const isDay = phase === 'day';
  const isVoting = phase === 'voting';

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Loading game..." />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner text="Reconnecting to server..." />
        <button onClick={() => { leaveRoom(); navigate('/'); }} className="btn-secondary text-sm">
          Leave Game
        </button>
      </div>
    );
  }

  if (phase === 'ended') {
    const winnerTeam = gameState.winner;
    const winnerEmoji = winnerTeam === 'mafia' ? '🔪' : winnerTeam === 'town' ? '⭐' : winnerTeam === 'neutral' ? '🌀' : '🏆';

    return (
      <div className="animate-fade-in space-y-6">
        <div className="card p-8 max-w-lg mx-auto text-center space-y-4">
          <div className="text-6xl mb-2">{winnerEmoji}</div>
          <h2 className="text-3xl font-bold">
            {winnerTeam === 'mafia' && '🔪 Mafia Wins!'}
            {winnerTeam === 'town' && '⭐ Town Wins!'}
            {winnerTeam === 'neutral' && '🌀 Neutral Wins!'}
          </h2>
          <p className="text-gray-400">
            Game lasted {gameState.day} {gameState.day === 1 ? 'day' : 'days'} with {players.length} players.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={async () => {
                setPlayAgainLoading(true);
                try {
                  await playAgain();
                  navigate('/lobby');
                } catch {
                  addToast('error', 'Failed to restart');
                  setPlayAgainLoading(false);
                }
              }}
              disabled={playAgainLoading}
              className="btn-primary"
            >
              {playAgainLoading ? 'Restarting...' : 'Play Again'}
            </button>
            <button
              onClick={() => leaveRoom()}
              className="btn-secondary"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4">All Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((p) => (
              <div key={p.id} className={`card p-3 flex items-center gap-3 ${!p.alive ? 'opacity-50' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${p.alive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.role?.name ?? 'Unknown'} ({p.team})</p>
                </div>
                <span className={`text-xs ${p.alive ? 'text-green-400' : 'text-red-400'}`}>
                  {p.alive ? 'Alive' : 'Dead'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in ${isNight ? 'relative' : ''}`}>
        <div className="md:col-span-1 lg:col-span-2 space-y-4">
          <PhaseIndicator phase={phase} day={gameState.day} endsAt={gameState.phaseEndsAt} />

          {currentPlayer?.role && !isDead && <RoleCard role={currentPlayer.role} />}

          {isDead && <DeathReveal player={currentPlayer} />}

          {isNight && (
            <div className="card p-4">
              <p className="text-sm text-indigo-300 text-center">
                🌙 Night falls over the town... close your eyes
              </p>
            </div>
          )}

          {isDay && (
            <div className="card p-4 bg-amber-950/30 border-amber-800/30">
              <p className="text-sm text-amber-300 text-center">
                ☀️ Day has come. Discuss who might be Mafia!
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {alivePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === playerId}
                phase={phase}
                isDead={isDead}
              />
            ))}
          </div>

          {deadPlayers.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm text-gray-400 mb-2">💀 Dead ({deadPlayers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {deadPlayers.map((p) => (
                  <span key={p.id} className="text-sm text-gray-500 flex items-center gap-1">
                    {p.name}
                    {p.role && <span className="text-xs text-gray-600">({p.role.name})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isNight && currentPlayer?.role?.nightAction && !isDead && (
            <NightActions
              players={alivePlayers.filter((p) => p.id !== playerId)}
              role={currentPlayer.role}
              onSubmit={async (targetId, actionType) => {
                try {
                  await submitNightAction(targetId, actionType ?? currentPlayer.role!.id);
                  addToast('info', '🌙 Night action submitted');
                } catch (err) {
                  addToast('error', err instanceof Error ? err.message : 'Failed');
                }
              }}
            />
          )}

          {isVoting && !isDead && (
            <VotingPanel
              players={alivePlayers.filter((p) => p.id !== playerId)}
              hasVoted={gameState.votes?.some((v) => v.from === playerId) ?? false}
              onSubmit={async (targetId) => {
                try {
                  await submitVote(targetId);
                  addToast('info', '🗳️ Vote submitted');
                } catch (err) {
                  addToast('error', err instanceof Error ? err.message : 'Failed');
                }
              }}
            />
          )}
        </div>

        <div className="space-y-4">
          <VoiceChat />
          {isDead && <SpectatorOverlay />}
          <ChatPanel isNight={isNight} isDead={isDead} />
          <GameLog events={gameState.history ?? []} />
        </div>
      </div>
    </>
  );
}
