import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { CinematicDeathOverlay } from '../components/cinematic/CinematicDeathOverlay';
import { WinCelebration } from '../components/cinematic/WinCelebration';
import { SkeletonGame } from '../components/common/Skeleton';
import { useSound } from '../hooks/useSound';

export function Game() {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const connected = useGameStore((s) => s.connected);
  const navigate = useNavigate();
  const { leaveRoom, submitNightAction, submitVote, playAgain } = useSocket();
  const { addToast } = useUIStore();
  const [playAgainLoading, setPlayAgainLoading] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const prevAliveRef = useRef(true);
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

  useEffect(() => {
    if (currentPlayer && prevAliveRef.current && !currentPlayer.alive) {
      setShowDeathEffect(true);
      const timer = setTimeout(() => setShowDeathEffect(false), 3000);
      return () => clearTimeout(timer);
    }
    prevAliveRef.current = currentPlayer?.alive ?? true;
  }, [currentPlayer?.alive]);

  if (!gameState) {
    return <SkeletonGame />;
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 animate-pulse">{t('game.reconnecting')}</p>
        <button onClick={() => { leaveRoom(); navigate('/'); }} className="btn-secondary text-sm">
          {t('game.leaveGame')}
        </button>
      </div>
    );
  }

  if (phase === 'ended') {
    const winnerTeam = gameState.winner;
    return (
      <>
        <WinCelebration
          winner={winnerTeam}
          onPlayAgain={async () => {
            setPlayAgainLoading(true);
            try {
              await playAgain();
              navigate('/lobby');
            } catch {
              addToast('error', t('game.failedToRestart'));
              setPlayAgainLoading(false);
            }
          }}
          onLeave={() => leaveRoom()}
          playAgainLoading={playAgainLoading}
        />
        <div className="card p-6 mt-4">
          <h3 className="text-lg font-bold mb-4">{t('game.allRoles')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((p) => (
              <div key={p.id} className={`card p-3 flex items-center gap-3 ${!p.alive ? 'opacity-50' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${p.alive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.role?.name ?? t('game.unknown')} ({p.team})</p>
                </div>
                <span className={`text-xs ${p.alive ? 'text-green-400' : 'text-red-400'}`}>
                  {p.alive ? t('game.alive') : t('game.dead')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {showDeathEffect && <CinematicDeathOverlay onComplete={() => setShowDeathEffect(false)} />}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in ${isNight ? 'relative' : ''}`}>
        <div className="md:col-span-1 lg:col-span-2 space-y-4">
          <PhaseIndicator phase={phase} day={gameState.day} endsAt={gameState.phaseEndsAt} />

          {currentPlayer?.role && !isDead && <RoleCard role={currentPlayer.role} />}

          {isDead && currentPlayer?.role && <DeathReveal role={currentPlayer.role} />}

          {isNight && (
            <div className="card p-4 border-indigo-800/30 bg-indigo-950/20">
              <p className="text-sm text-indigo-300 text-center">
                {t('game.nightFalls')}
              </p>
            </div>
          )}

          {isDay && (
            <div className="card p-4 bg-amber-950/30 border-amber-800/30">
              <p className="text-sm text-amber-300 text-center">
                {t('game.dayHasCome')}
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
              <h3 className="text-sm text-gray-400 mb-2">{t('game.deadCount', { count: deadPlayers.length })}</h3>
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
                  addToast('info', t('game.nightActionSubmitted'));
                } catch (err) {
                  addToast('error', err instanceof Error ? err.message : t('game.failed'));
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
                  addToast('info', t('game.voteSubmitted'));
                } catch (err) {
                  addToast('error', err instanceof Error ? err.message : t('game.failed'));
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
