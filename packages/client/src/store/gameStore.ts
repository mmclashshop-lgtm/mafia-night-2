import { create } from 'zustand';
import { GameState, PlayerId, Token } from '@mafia/shared';

interface GameStore {
  connected: boolean;
  roomCode: string | null;
  playerId: PlayerId | null;
  playerName: string | null;
  token: Token | null;
  reconnectToken: string | null;
  gameState: GameState | null;
  error: string | null;

  setConnected: (connected: boolean) => void;
  setRoomCode: (code: string | null) => void;
  setPlayerId: (id: PlayerId | null) => void;
  setPlayerName: (name: string | null) => void;
  setToken: (token: Token | null) => void;
  setReconnectToken: (token: string | null) => void;
  setGameState: (state: GameState | null | ((prev: GameState | null) => GameState | null)) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  roomCode: null,
  playerId: null,
  playerName: null,
  token: null,
  reconnectToken: null,
  gameState: null,
  error: null,

  setConnected: (connected) => set({ connected }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (playerName) => set({ playerName }),
  setToken: (token) => set({ token }),
  setReconnectToken: (reconnectToken) => set({ reconnectToken }),
  setGameState: (updater) =>
    set((state) => ({
      gameState: typeof updater === 'function' ? (updater as (prev: GameState | null) => GameState | null)(state.gameState) : updater,
    })),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      connected: false,
      roomCode: null,
      playerId: null,
      playerName: null,
      token: null,
      reconnectToken: null,
      gameState: null,
      error: null,
    }),
}));
