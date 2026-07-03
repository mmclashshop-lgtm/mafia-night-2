import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { useUIStore } from '../store/uiStore';
import { SettingsPanel } from '../components/lobby/SettingsPanel';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { TiltCard } from '../components/common/TiltCard';
import { RippleButton } from '../components/common/RippleButton';
import { copyToClipboard } from '../lib/utils';
import { Copy, LogOut, Play, Users, Clock, CheckCircle2, Bot } from 'lucide-react';

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
    <div className="animate-fade-in space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{t('lobby.title')}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {t('lobby.shareCode')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleCopyCode} className="btn-secondary flex items-center gap-2">
              <Copy className="w-4 h-4" />
              <code className="text-lg font-mono tracking-widest">{roomCode}</code>
            </button>

            <button
              onClick={() => leaveRoom()}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> {t('lobby.leave')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{t('lobby.playersCount', { current: players.length, max: gameState?.settings?.maxPlayers ?? 12 })}</span>
          </div>

          {isHost && gameState && (
            <div className="flex items-center gap-2 flex-wrap">
              <SettingsPanel
                settings={gameState.settings}
                onUpdate={async (s) => { await updateSettings(s); }}
              />
              <button onClick={handleAddBots} disabled={addingBots} className="btn-secondary flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4" />
                {addingBots ? t('lobby.adding') : t('lobby.addBots')}
              </button>
              {players.length >= (gameState?.settings?.minPlayers ?? 4) && (
                <RippleButton
                  onClick={handleStart}
                  disabled={starting || unreadyHumanCount > 0}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {starting ? t('lobby.starting') : unreadyHumanCount > 0 ? t('lobby.notReadyCount', { count: unreadyHumanCount }) : t('lobby.start')}
                </RippleButton>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {players.map((player, idx) => (
            <TiltCard key={player.id} maxTilt={5} glare={false} className={`${player.id === playerId ? 'ring-2 ring-red-700 shadow-[0_0_12px_rgba(139,0,0,0.3)] rounded-xl' : ''}`}>
              <div className={`card p-3 flex items-center gap-3 ${player.disconnected ? 'opacity-50' : ''} h-full`}>
                <PlayerAvatar avatar={player.avatar} name={player.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{player.name}</p>
                  <p className="text-xs text-gray-500">
                    {idx === 0 ? t('lobby.host') : player.isBot ? t('lobby.bot') : t('lobby.player')}
                    {player.isBot && ' 🤖'}
                  </p>
                </div>
                {player.ready && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                )}
              </div>
            </TiltCard>
          ))}
        </div>

        {currentPlayer && !currentPlayer.isBot && (
          <div className="mt-4">
            <button
              onClick={toggleReady}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                currentPlayer.ready
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              {currentPlayer.ready ? t('lobby.ready') : t('lobby.clickToReady')}
            </button>
          </div>
        )}

        {players.length < (gameState?.settings?.minPlayers ?? 4) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400 animate-pulse-slow">
            <Clock className="w-4 h-4" />
            {t('lobby.waitingForPlayers', { count: gameState?.settings?.minPlayers ?? 4 })}
          </div>
        )}
      </div>
    </div>
  );
}
