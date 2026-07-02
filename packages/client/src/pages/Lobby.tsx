import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { useUIStore } from '../store/uiStore';
import { SettingsPanel } from '../components/lobby/SettingsPanel';
import { copyToClipboard } from '../lib/utils';
import { Copy, LogOut, Play, Users, Clock, CheckCircle2 } from 'lucide-react';

export function Lobby() {
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
  const isHost = !!playerId && players[0]?.id === playerId;
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
      addToast('error', err instanceof Error ? err.message : 'Failed to start');
      setStarting(false);
    }
  };

  const handleAddBots = async () => {
    setAddingBots(true);
    try {
      const current = players.length;
      const max = gameState?.settings?.maxPlayers ?? 12;
      const count = Math.min(3, max - current);
      if (count <= 0) { addToast('info', 'Room is full'); return; }
      await addBots(count);
      addToast('success', `Added ${count} bot${count > 1 ? 's' : ''}`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to add bots');
    }
    setAddingBots(false);
  };

  const handleCopyCode = () => {
    if (roomCode) {
      copyToClipboard(roomCode);
      addToast('success', 'Room code copied!');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Game Lobby</h2>
            <p className="text-gray-400 text-sm mt-1">
              Share the code with friends to join
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
              <LogOut className="w-4 h-4" /> Leave
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{players.length} / {gameState?.settings?.maxPlayers ?? 12} Players</span>
          </div>

          {isHost && gameState && (
            <div className="flex items-center gap-2 flex-wrap">
              <SettingsPanel
                settings={gameState.settings}
                onUpdate={async (s) => { await updateSettings(s); }}
              />
              <button onClick={handleAddBots} disabled={addingBots} className="btn-secondary flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                {addingBots ? 'Adding...' : 'Add Bots'}
              </button>
              {players.length >= (gameState?.settings?.minPlayers ?? 4) && (
                <button
                  onClick={handleStart}
                  disabled={starting || unreadyHumanCount > 0}
                  className="btn-primary flex items-center gap-2"
                  title={unreadyHumanCount > 0 ? `${unreadyHumanCount} player(s) not ready` : 'Start game'}
                >
                  <Play className="w-4 h-4" />
                  {starting ? 'Starting...' : unreadyHumanCount > 0 ? `${unreadyHumanCount} not ready` : 'Start'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className={`card p-3 flex items-center gap-3 ${player.id === playerId ? 'ring-2 ring-red-700 shadow-[0_0_12px_rgba(139,0,0,0.3)]' : ''} ${player.disconnected ? 'opacity-50' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{player.name}</p>
                <p className="text-xs text-gray-500">{idx === 0 ? 'Host' : player.isBot ? 'Bot' : 'Player'}</p>
              </div>
              {player.ready && (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {currentPlayer && !currentPlayer.isBot && (
          <div className="mt-4">
            <button
              onClick={toggleReady}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPlayer.ready
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              {currentPlayer.ready ? '✅ Ready!' : '👆 Click to Ready Up'}
            </button>
          </div>
        )}

        {players.length < (gameState?.settings?.minPlayers ?? 4) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400">
            <Clock className="w-4 h-4" />
            Waiting for at least {gameState?.settings?.minPlayers ?? 4} players...
          </div>
        )}
      </div>
    </div>
  );
}
