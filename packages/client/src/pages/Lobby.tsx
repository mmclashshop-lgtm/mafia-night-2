import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { useUIStore } from '../store/uiStore';
import { SettingsPanel } from '../components/lobby/SettingsPanel';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { TiltCard } from '../components/common/TiltCard';
import { PageTransition } from '../components/common/PageTransition';
import { copyToClipboard } from '../lib/utils';
import {
  Copy, LogOut, Play, Users, Clock, CheckCircle2, Bot, Settings,
} from 'lucide-react';

export function Lobby() {
  const { t } = useTranslation();
  const roomCode = useGameStore((s) => s.roomCode);
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const navigate = useNavigate();
  const { leaveRoom, startGame, toggleReady, addBots, updateSettings } = useSocket();
  const { addToast } = useUIStore();
  const [starting, setStarting] = useState(false);
  const [addingBots, setAddingBots] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const players = gameState?.players ?? [];
  const phase = gameState?.phase;
  const currentPlayer = players.find((p) => p.id === playerId);
  const isHost = !!playerId && players.find(p => !p.isBot)?.id === playerId;
  const unreadyHumanCount = players.filter(p => !p.isBot && !p.ready).length;

  useEffect(() => {
    if (phase && phase !== 'lobby') {
      navigate('/game');
    }
  }, [phase, navigate]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startGame();
      navigate('/game');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('lobby.failedToStart'));
      setStarting(false);
    }
  };

  const handleAddBots = async () => {
    setAddingBots(true);
    try {
      const current = players.length;
      const max = gameState?.settings?.maxPlayers ?? 12;
      const count = Math.min(3, max - current);
      if (count <= 0) { addToast('info', t('lobby.roomIsFull')); return; }
      await addBots(count);
      addToast('success', t('lobby.addedBots', { count }));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('lobby.failedToAddBots'));
    }
    setAddingBots(false);
  };

  const handleCopyCode = () => {
    if (roomCode) {
      copyToClipboard(roomCode);
      addToast('success', t('lobby.roomCodeCopied'));
    }
  };

  return (
    <PageTransition>
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="card-glass p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">{t('lobby.title')}</h2>
            <p className="text-gray-400 text-xs mt-0.5">{t('lobby.shareCode')}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleCopyCode} className="btn-secondary flex items-center gap-2 px-3 py-2 text-xs">
              <Copy className="w-3.5 h-3.5" />
              <code className="text-base font-mono tracking-widest">{roomCode}</code>
            </button>
            <button onClick={() => leaveRoom()} className="btn-ghost text-xs">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Player count bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#8B0000]/10">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{t('lobby.playersCount', { current: players.length, max: gameState?.settings?.maxPlayers ?? 12 })}</span>
          </div>

          {players.length < (gameState?.settings?.minPlayers ?? 4) && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-400 animate-pulse-slow">
              <Clock className="w-3 h-3" />
              {t('lobby.waitingForPlayers', { count: gameState?.settings?.minPlayers ?? 4 })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Player Grid ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {players.map((player, idx) => {
          const isCurrent = player.id === playerId;
          const teamColor = player.team === 'mafia' ? 'red' : player.team === 'town' ? 'blue' : 'purple';
          const borderColor = isCurrent
            ? 'border-[#B22222] shadow-[0_0_15px_rgba(139,0,0,0.3)]'
            : player.isBot
              ? 'border-gray-700/50'
              : 'border-transparent';

          return (
            <TiltCard key={player.id} maxTilt={4} glare={true} scale={1.01}>
              <div
                className={`card relative p-4 flex flex-col items-center gap-2 text-center h-full
                  ${player.disconnected ? 'opacity-50' : ''}
                  border-2 ${borderColor} transition-all duration-300`}
              >
                {/* Index badge */}
                <span className="absolute top-2 right-2 text-[10px] font-mono text-gray-600">
                  #{idx + 1}
                </span>

                {/* Avatar */}
                <div className={`relative ${isCurrent ? 'ring-2 ring-[#B22222] rounded-full ring-offset-2 ring-offset-[#0A0A0A]' : ''}`}>
                  <PlayerAvatar avatar={player.avatar} name={player.name} size="lg" />
                  {player.ready && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-900/50">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                {/* Name */}
                <p className="text-sm font-semibold truncate w-full">
                  {player.name}
                  {player.isBot && ' 🤖'}
                </p>

                {/* Labels */}
                <div className="flex items-center gap-1.5">
                  {idx === 0 && !player.isBot && (
                    <span className="badge-gold text-[10px]">{t('lobby.host')}</span>
                  )}
                  {player.isBot ? (
                    <span className="text-[10px] text-gray-500 font-medium">{t('lobby.bot')}</span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-medium">{t('lobby.player')}</span>
                  )}
                </div>
              </div>
            </TiltCard>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, (gameState?.settings?.maxPlayers ?? 12) - players.length) }).slice(0, 4).map((_, i) => (
          <div key={`empty-${i}`} className="card border border-dashed border-gray-800/50 p-4 flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-6 h-6 text-gray-700 mx-auto mb-1" />
              <p className="text-xs text-gray-700 font-medium">{t('lobby.emptySlot')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Controls ─── */}
      <div className="card-glass p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Ready / Waiting */}
          {currentPlayer && !currentPlayer.isBot && (
            <button
              onClick={toggleReady}
              className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                currentPlayer.ready
                  ? 'bg-green-600/90 hover:bg-green-600 text-white shadow-lg shadow-green-900/30 border border-green-500/30'
                  : 'bg-[#1A1A1A] hover:bg-[#222] text-gray-300 border border-[#8B0000]/20 hover:border-[#8B0000]/40'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {currentPlayer.ready ? (
                  <><CheckCircle2 className="w-4 h-4" /> {t('lobby.ready')}</>
                ) : (
                  <>{t('lobby.clickToReady')}</>
                )}
              </div>
            </button>
          )}

          {/* Host controls */}
          {isHost && gameState && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSettingsOpen(!settingsOpen)} className="btn-secondary px-3 py-3 text-xs">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleAddBots} disabled={addingBots} className="btn-secondary px-3 py-3 text-xs">
                <Bot className={`w-4 h-4 ${addingBots ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleStart}
                disabled={starting || players.length < (gameState?.settings?.minPlayers ?? 4) || unreadyHumanCount > 0}
                className="btn-primary px-6 py-3 text-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {starting
                  ? t('lobby.starting')
                  : unreadyHumanCount > 0
                    ? t('lobby.notReadyCount', { count: unreadyHumanCount })
                    : t('lobby.start')}
              </button>
            </div>
          )}
        </div>

        {/* Settings panel */}
        {settingsOpen && isHost && gameState && (
          <div className="mt-4 animate-slide-down">
            <SettingsPanel
              settings={gameState.settings}
              onUpdate={async (s) => { await updateSettings(s); }}
            />
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
