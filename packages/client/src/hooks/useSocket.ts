import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket, getSocket, updateSocketAuth } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useSocialStore } from '../store/socialStore';
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
    const userId = useAuthStore.getState().userId;
    const token = useGameStore.getState().token;
    const socket = connectSocket(userId ?? undefined, token ?? undefined);

    socket.on('connect', () => {
      setConnected(true);
      // Reconnect to game if we have a reconnectToken
      const { roomCode, reconnectToken, playerId } = useGameStore.getState();
      if (roomCode && reconnectToken) {
        socket.emit('room:reconnect', { roomCode, userId: playerId, reconnectToken }, (res: { success: boolean; state?: GameState; token?: Token; error?: string }) => {
          if (res.success && res.state) {
            setGameState(res.state);
            if (res.token) setToken(res.token);
            addToast('success', 'Reconnected to game');
          } else {
            addToast('error', `Failed to reconnect: ${res.error ?? 'unknown'}`);
          }
        });
      } else if (roomCode) {
        // Legacy: rejoin by name if no reconnectToken
        const { playerName } = useGameStore.getState();
        if (playerName) {
          socket.emit('room:join', { roomCode, name: playerName }, (res: { success: boolean; state?: GameState; token?: Token; error?: string }) => {
            if (res.success && res.state) {
              setGameState(res.state);
              if (res.token) setToken(res.token);
              const player = res.state.players.find(p => p.name === playerName);
              if (player) setPlayerId(player.id);
              addToast('success', 'Reconnected to game');
            } else {
              addToast('error', `Failed to rejoin room: ${res.error ?? 'unknown'}`);
            }
          });
        }
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

    socket.on('achievements:unlocked', (data: { achievements: string[]; score: number; rank: string }) => {
      const count = data.achievements.length;
      if (count > 0) {
        const names = data.achievements.map((id) => {
          const map: Record<string, string> = {
            first_blood: '🏆 First Blood',
            comeback_king: '🔄 Comeback King',
            witchs_brew: '🧪 Witch\'s Brew',
            sniper_elite: '🎯 Sniper Elite',
            perfect_game: '💎 Perfect Game',
            fast_win: '⚡ Fast Win',
            last_standing: '💀 Last Standing',
          };
          return map[id] ?? id;
        });
        addToast('success', `Achievements unlocked: ${names.join(', ')}`);
      }
    });

    socket.on('game:rewards', (data: { xp: number; eloDelta: number; newElo: number; newLevel: number; questBonusXP?: number; totalXP?: number }) => {
      const profile = useAuthStore.getState().profile;
      if (profile) {
        useAuthStore.getState().updateElo('casual', data.newElo);
        useAuthStore.getState().updateXP(data.xp + (data.questBonusXP ?? 0), data.newLevel);
      }
      const eloSign = data.eloDelta >= 0 ? '+' : '';
      const questText = data.questBonusXP ? ` · 🎯 +${data.questBonusXP} quest XP` : '';
      addToast('success', `⚡ +${data.xp} XP${questText} · ${eloSign}${data.eloDelta} ELO · Level ${data.newLevel}`);
    });

    // Friend events
    socket.on('friend:request', (data: { fromUserId: string; fromName: string; fromAvatar: string }) => {
      useSocialStore.getState().addFriendRequest(data);
      addToast('info', `${data.fromName} sent you a friend request`);
    });

    socket.on('friend:request-accepted', (data: { userId: string; name: string; avatar: string }) => {
      useSocialStore.getState().addFriend({
        userId: data.userId,
        name: data.name,
        avatar: data.avatar,
        status: 'online',
        lastActiveAt: Date.now(),
        elo: 1000,
        level: 1,
      });
      addToast('success', `${data.name} accepted your friend request`);
    });

    socket.on('friend:request-rejected', (data: { userId: string }) => {
      useSocialStore.getState().removeFriendRequest(data.userId);
    });

    socket.on('friend:removed', (data: { userId: string }) => {
      useSocialStore.getState().removeFriend(data.userId);
    });

    socket.on('friend:status', (data: { userId: string; status: 'online' | 'in_game' | 'idle' | 'offline' }) => {
      useSocialStore.getState().updateFriendStatus(data.userId, data.status);
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
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state:sync');
      socket.off('phase:change');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('player:died');
      socket.off('error');
      socket.off('game:end');
      socket.off('matchmaking:found');
      socket.off('matchmaking:update');
      socket.off('achievements:unlocked');
      socket.off('game:rewards');
      socket.off('friend:request');
      socket.off('friend:request-accepted');
      socket.off('friend:request-rejected');
      socket.off('friend:removed');
      socket.off('friend:status');
    };
  }, []);

  const createRoom = useCallback((settings?: Record<string, unknown>): Promise<string> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit('room:create', { settings }, (res: { roomCode: string; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else {
          setRoomCode(res.roomCode);
          resolve(res.roomCode);
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, name: string, reconnectToken?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit('room:join', { roomCode, name, reconnectToken }, (res: { success: boolean; state?: GameState; token?: Token; error?: string }) => {
        if (res.error || !res.success) reject(new Error(res.error || 'Failed to join'));
        else {
          setRoomCode(roomCode);
          setPlayerName(name);
          if (res.token) setToken(res.token);
          if (res.state) setGameState(res.state);
          const player = res.state?.players.find((p) => p.name === name);
          if (player) {
            setPlayerId(player.id);
            if (player.reconnectToken) setReconnectToken(player.reconnectToken);
          }
          resolve();
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    getSocket().emit('room:leave');
    reset();
  }, []);

  const startGame = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('game:start', (res: { success: boolean; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else resolve();
      });
    });
  }, []);

  const submitNightAction = useCallback((targetId: string, actionType: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('action:night', { targetId, actionType }, (res: { success: boolean; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else resolve();
      });
    });
  }, []);

  const submitVote = useCallback((targetId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('action:vote', { targetId }, (res: { success: boolean; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else resolve();
      });
    });
  }, []);

  const sendChat = useCallback((text: string) => {
    getSocket().emit('chat:message', { text });
  }, []);

  const sendMafiaChat = useCallback((text: string) => {
    getSocket().emit('chat:mafia', { text });
  }, []);

  const toggleReady = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('room:toggleReady', (res: { success: boolean; error?: string }) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed'));
      });
    });
  }, []);

  const addBots = useCallback((count: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('room:addBots', { count }, (res: { success: boolean; state?: GameState; error?: string }) => {
        if (res.error || !res.success) reject(new Error(res.error || 'Failed to add bots'));
        else {
          if (res.state) setGameState(res.state);
          resolve();
        }
      });
    });
  }, []);

  const playAgain = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('game:playAgain', (res: { success: boolean; error?: string }) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed'));
      });
    });
  }, []);

  const joinMatchmaking = useCallback((name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('matchmaking:join', { name }, (res: { success: boolean; error?: string }) => {
        if (res.success) resolve();
        else reject(new Error(res.error || 'Failed to join matchmaking'));
      });
    });
  }, []);

  const leaveMatchmaking = useCallback(() => {
    getSocket().emit('matchmaking:leave');
  }, []);

  const updateSettings = useCallback((settings: Record<string, unknown>): Promise<void> => {
    return new Promise((resolve, reject) => {
      getSocket().emit('room:updateSettings', settings, (res: { success: boolean; state?: GameState; error?: string }) => {
        if (res.error || !res.success) reject(new Error(res.error || 'Failed to update settings'));
        else {
          if (res.state) setGameState(res.state);
          resolve();
        }
      });
    });
  }, []);

  const reconnectToGame = useCallback((roomCode: string, userId: string, reconnectToken: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      socket.emit('room:reconnect', { roomCode, userId, reconnectToken }, (res: { success: boolean; state?: GameState; token?: Token; error?: string }) => {
        if (res.error || !res.success) reject(new Error(res.error || 'Reconnection failed'));
        else {
          setRoomCode(roomCode);
          if (res.token) setToken(res.token);
          if (res.state) setGameState(res.state);
          setPlayerId(userId as any);
          resolve();
        }
      });
    });
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
