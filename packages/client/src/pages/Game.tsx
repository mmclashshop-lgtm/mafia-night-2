import { useEffect, useRef, useState } from 'react';
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
import { PhaseTransitionOverlay } from '../components/game/PhaseTransitionOverlay';
import { SkeletonGame } from '../components/common/Skeleton';
import { useSound } from '../hooks/useSound';
import { useSoundStore } from '../store/soundStore';
import { TEAM_COLORS } from '@mafia/shared';
import { Users, Skull, LogOut, Volume2, VolumeX } from 'lucide-react';

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
  const { muted, toggleMuted } = useSoundStore();

  const phase = gameState?.phase ?? 'lobby';
  const players = gameState?.players ?? [];
  const currentPlayer = players.find((p) => p.id === playerId);
  const alivePlayers = players.filter((p) => p.alive);
  const deadPlayers = players.filter((p) => !p.alive);
  const isDead = currentPlayer ? !currentPlayer.alive : false;
  const isNight = phase === 'night';
  const isVoting = phase === 'voting';

  useEffect(() => {
    if (currentPlayer && prevAliveRef.current && !currentPlayer.alive) {
      setShowDeathEffect(true);
      const timer = setTimeout(() => setShowDeathEffect(false), 3000);
      return () => clearTimeout(timer);
    }
    prevAliveRef.current = currentPlayer?.alive ?? true;
  }, [currentPlayer?.alive]);

  if (!gameState) return <SkeletonGame />;

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-[3px] border-[#8B0000] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 animate-pulse text-sm">{t('game.reconnecting')}</p>
        <button onClick={() => { leaveRoom(); navigate('/'); }} className="btn-secondary text-sm">
          <LogOut className="w-4 h-4" /> {t('game.leaveGame')}
        </button>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="animate-fade-in">
        <WinCelebration
          winner={gameState.winner}
          onPlayAgain={async () => {
            setPlayAgainLoading(true);
            try { await playAgain(); navigate('/lobby'); }
            catch { addToast('error', t('game.failedToRestart')); setPlayAgainLoading(false); }
          }}
          onLeave={() => leaveRoom()}
          playAgainLoading={playAgainLoading}
        />
        <div className="card-glass p-5 mt-4 card-shine">
          <h3 className="section-title mb-4">{t('game.allRoles')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
            {players.map((p) => (
              <div key={p.id} className={`card-hover flex items-center gap-3 p-2.5 rounded-lg ${!p.alive ? 'opacity-50' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${p.alive ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {p.role?.name ?? t('game.unknown')}
                    <span className="mr-1" style={{ color: TEAM_COLORS[p.team] }}> ({p.team})</span>
                  </p>
                </div>
                <span className={`text-[11px] font-semibold ${p.alive ? 'text-green-400' : 'text-red-400'}`}>
                  {p.alive ? t('game.alive') : t('game.dead')}
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
      <PhaseTransitionOverlay>
        {showDeathEffect && <CinematicDeathOverlay onComplete={() => setShowDeathEffect(false)} />}
        <div className={`animate-fade-in space-y-4 ${isNight ? 'relative' : ''}`}>
        <PhaseIndicator phase={phase} day={gameState.day} endsAt={gameState.phaseEndsAt} />

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <button onClick={toggleMuted} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title={muted ? t('game.unmute') : t('game.mute')}>
              {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
            </button>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 font-medium">{alivePlayers.length}</span>
              <span>{t('game.alive')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-medium">{deadPlayers.length}</span>
              <span>{t('game.dead')}</span>
            </span>
          </div>
        </div>

        {currentPlayer?.role && !isDead && <RoleCard role={currentPlayer.role} />}
        {isDead && currentPlayer?.role && <DeathReveal role={currentPlayer.role} />}

        {isNight && (
          <div className="card-glass p-3 border-indigo-800/30 text-center">
            <p className="text-sm text-indigo-300 font-medium">{t('game.nightFalls')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {alivePlayers.map((player) => (
                <PlayerCard key={player.id} player={player} isCurrentPlayer={player.id === playerId} phase={phase} isDead={isDead} />
              ))}
            </div>

            {deadPlayers.length > 0 && (
              <div className="card-glass p-3">
                <h3 className="section-title text-xs mb-2">
                  <Skull className="w-3 h-3" />
                  {t('game.deadCount', { count: deadPlayers.length })}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {deadPlayers.map((p) => (
                    <span key={p.id} className="text-xs text-gray-500 flex items-center gap-1 bg-white/[0.03] px-2 py-1 rounded-md border border-gray-800/30">{p.name}</span>
                  ))}
                </div>
              </div>
            )}

            {isNight && currentPlayer?.role?.nightAction && !isDead && (
              <NightActions
                players={alivePlayers.filter((p) => p.id !== playerId)}
                role={currentPlayer.role}
                onSubmit={async (targetId, actionType) => {
                  try { await submitNightAction(targetId, actionType ?? currentPlayer.role!.id); addToast('info', t('game.nightActionSubmitted')); }
                  catch (err) { addToast('error', err instanceof Error ? err.message : t('game.failed')); }
                }}
              />
            )}

            {isVoting && !isDead && (
              <VotingPanel
                players={alivePlayers.filter((p) => p.id !== playerId)}
                hasVoted={gameState.votes?.some((v) => v.from === playerId) ?? false}
                onSubmit={async (targetId) => {
                  try { await submitVote(targetId); addToast('info', t('game.voteSubmitted')); }
                  catch (err) { addToast('error', err instanceof Error ? err.message : t('game.failed')); }
                }}
              />
            )}
          </div>

          <div className="space-y-4">
            <VoiceChat />
            {isDead && <SpectatorOverlay />}
            <ChatPanel isNight={isNight} isDead={isDead} />
            <GameLog events={gameState.history ?? []} players={players} />
          </div>
        </div>
      </div>
      </PhaseTransitionOverlay>
    </>
  );
}
