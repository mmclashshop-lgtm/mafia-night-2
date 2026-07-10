import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket, getSocket, emitNoData, emitWithData, emitVoid } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import type { GameState, Token } from '@mafia/shared';

export function useSocket() {
  const navigate = useNavigate();
  const {
    setConnected,
    setGameState,
    setRoomCode,
    setPlayerId,
    setPlayerName,
    setToken,
    setReconnectToken,
    setError,
    reset,
  } = useGameStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    const socket = connectSocket();

    let reconnectTimer: ReturnType<typeof setTimeout>;

    socket.on('connect', () => {
      setConnected(true);
      const { roomCode, reconnectToken, playerId, playerName } = useGameStore.getState();
      if (roomCode && reconnectToken) {
        reconnectTimer = setTimeout(async () => {
          try {
            const res = await emitWithData<{ success?: boolean; state?: GameState; token?: Token }>('room:reconnect', { roomCode, userId: playerId, reconnectToken }, 8000);
            if (res.state) setGameState(res.state);
            if (res.token) setToken(res.token);
            addToast('success', 'Reconnected to game');
          } catch (err) {
            addToast('error', `Failed to reconnect: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }, 300);
      } else if (roomCode && playerName) {
        reconnectTimer = setTimeout(async () => {
          try {
            const res = await emitWithData<{ success?: boolean; state?: GameState; token?: Token }>('room:join', { roomCode, name: playerName }, 8000);
            if (res.state) {
              setGameState(res.state);
              const player = res.state.players.find(p => p.name === playerName);
              if (player) setPlayerId(player.id);
            }
            if (res.token) setToken(res.token);
            addToast('success', 'Reconnected to game');
          } catch (err) {
            addToast('error', `Failed to rejoin room: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }, 300);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      addToast('error', 'Disconnected from server');
    });

    socket.on('matchmaking:found', (data: { roomCode: string; state: GameState }) => {
      setRoomCode(data.roomCode);
      setGameState(data.state);
      const playerName = useGameStore.getState().playerName;
      if (playerName) {
        const player = data.state.players.find((p) => p.name === playerName);
        if (player) setPlayerId(player.id);
      }
      navigate('/lobby');
    });

    socket.on('matchmaking:update', (data: { queueSize: number }) => {
      // Handled by the MatchmakingOverlay component
    });

    socket.on('state:sync', (data: { state: GameState }) => {
      setGameState(data.state);
      // Extract our reconnectToken if available
      const { playerId } = useGameStore.getState();
      if (playerId) {
        const me = data.state.players.find(p => p.id === playerId);
        if (me?.reconnectToken) {
          setReconnectToken(me.reconnectToken);
        }
      }
    });

    socket.on('phase:change', (data: { phase: string; endsAt: number }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const updated = structuredClone(prev);
        updated.phase = data.phase as GameState['phase'];
        updated.phaseStartedAt = Date.now();
        updated.phaseEndsAt = data.endsAt;
        return updated;
      });
    });

    socket.on('player:joined', (data) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, players: [...prev.players, data.player] };
      });
    });

    socket.on('player:left', (data) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === data.playerId ? { ...p, disconnected: true } : p
          ),
        };
      });
    });

    socket.on('game:special', (data: { type: string; members?: Array<{ id: string; name: string }>; saveAvailable?: boolean; killAvailable?: boolean; partner?: { id: string; name: string } | null; target?: { id: string; name: string }; result?: string }) => {
      if (data.type === 'mafia_team' && data.members) {
        const names = data.members.map(m => m.name).join(', ');
        addToast('info', `🔪 Your mafia team: ${names}`);
      }
      if (data.type === 'witch_state') {
        const saves = data.saveAvailable ? '💚 Save potion available' : '';
        const kills = data.killAvailable ? '💀 Kill potion available' : '';
        addToast('info', `🧪 Witch: ${saves} ${kills}`.trim());
      }
      if (data.type === 'lover_paired' && data.partner) {
        addToast('info', `💕 You are paired with ${data.partner.name} as lovers!`);
      }
      if (data.type === 'investigation_result' && data.target && data.result) {
        addToast('info', `🔍 ${data.target.name}: ${data.result}`);
      }
    });

    socket.on('player:died', (data: { playerId: string; name?: string; role: string; cause?: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === data.playerId ? { ...p, alive: false } : p
          ),
        };
      });
      addToast('info', `${data.name ?? 'A player'} was eliminated`);
    });

    socket.on('error', (data: { code: string; message: string }) => {
      setError(data.message);
      addToast('error', data.message);
    });

    socket.on('game:rewards', (data: { xp: number; totalXP: number; newLevel: number; newAchievements?: string[] }) => {
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach((id) => {
          addToast('success', `🏆 Achievement unlocked!`);
        });
      }
    });

    socket.on('game:end', (data: { winner: string; players?: Array<{ id: string; name: string; role: string; team: string; alive: boolean }> }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const updated = structuredClone(prev);
        updated.phase = 'ended';
        updated.winner = data.winner as GameState['winner'];
        if (data.players) {
          updated.players = data.players.map(dp => {
            const existing = prev.players.find(p => p.id === dp.id);
            if (existing) {
              return { ...existing, alive: dp.alive };
            }
            return existing;
          }).filter(Boolean) as typeof updated.players;
        }
        return updated;
      });
      navigate('/game');
    });

    return () => {
      clearTimeout(reconnectTimer);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state:sync');
      socket.off('phase:change');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('player:died');
      socket.off('error');
      socket.off('game:rewards');
      socket.off('game:end');
      socket.off('matchmaking:found');
      socket.off('matchmaking:update');
    };
  }, []);

  const createRoom = useCallback(async (settings?: Record<string, unknown>): Promise<string> => {
    const res = await emitWithData<{ roomCode: string }>('room:create', { settings });
    setRoomCode(res.roomCode);
    return res.roomCode;
  }, []);

  const joinRoom = useCallback(async (roomCode: string, name: string, reconnectToken?: string): Promise<void> => {
    const res = await emitWithData<{ state?: GameState; token?: Token }>('room:join', { roomCode, name, reconnectToken });
    setRoomCode(roomCode);
    setPlayerName(name);
    if (res.token) setToken(res.token);
    if (res.state) setGameState(res.state);
    const player = res.state?.players.find((p) => p.name === name);
    if (player) {
      setPlayerId(player.id);
      if (player.reconnectToken) setReconnectToken(player.reconnectToken);
    }
  }, []);

  const leaveRoom = useCallback(() => {
    emitVoid('room:leave');
    reset();
  }, []);

  const startGame = useCallback(async (): Promise<void> => {
    await emitNoData('game:start');
  }, []);

  const submitNightAction = useCallback(async (targetId: string, actionType: string): Promise<void> => {
    await emitWithData('action:night', { targetId, actionType });
  }, []);

  const submitVote = useCallback(async (targetId: string): Promise<void> => {
    await emitWithData('action:vote', { targetId });
  }, []);

  const sendChat = useCallback((text: string) => {
    getSocket().emit('chat:message', { text });
  }, []);

  const sendMafiaChat = useCallback((text: string) => {
    getSocket().emit('chat:mafia', { text });
  }, []);

  const toggleReady = useCallback(async (): Promise<void> => {
    await emitNoData('room:toggleReady');
  }, []);

  const addBots = useCallback(async (count: number): Promise<void> => {
    const res = await emitWithData<{ state?: GameState }>('room:addBots', { count });
    if (res.state) setGameState(res.state);
  }, []);

  const playAgain = useCallback(async (): Promise<void> => {
    await emitNoData('game:playAgain');
  }, []);

  const joinMatchmaking = useCallback(async (name: string): Promise<void> => {
    await emitWithData('matchmaking:join', { name });
  }, []);

  const leaveMatchmaking = useCallback(() => {
    emitVoid('matchmaking:leave');
  }, []);

  const updateSettings = useCallback(async (settings: Record<string, unknown>): Promise<void> => {
    const res = await emitWithData<{ state?: GameState }>('room:updateSettings', settings);
    if (res.state) setGameState(res.state);
  }, []);

  const reconnectToGame = useCallback(async (roomCode: string, userId: string, reconnectToken: string): Promise<void> => {
    const res = await emitWithData<{ token?: Token; state?: GameState }>('room:reconnect', { roomCode, userId, reconnectToken });
    setRoomCode(roomCode);
    if (res.token) setToken(res.token);
    if (res.state) setGameState(res.state);
    setPlayerId(userId as any);
  }, []);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitNightAction,
    submitVote,
    sendChat,
    sendMafiaChat,
    playAgain,
    toggleReady,
    addBots,
    updateSettings,
    joinMatchmaking,
    leaveMatchmaking,
    reconnectToGame,
  };
}
