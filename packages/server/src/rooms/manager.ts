import {
  createInitialState,
  addEvent,
  assignRoles,
  resolveNightActions,
  resolveVotes,
  checkWinCondition,
  canPhaseTransition,
  generateId,
  getAlivePlayers,
  GameState,
  Player,
  PlayerId,
  Phase,
  NightAction,
} from '@mafia/shared';
import { Server, Socket } from 'socket.io';
import {
  getBotNames,
  getBotDifficulty,
  botDecideNightAction,
  botDecideVote,
  botGetNightActionDelay,
  botGetVoteDelay,
} from '../game/botManager';
import { saveGame, getOrCreatePlayerProfile, savePlayerProfile } from '../db';
import { checkNewAchievements, checkProgressiveAchievements } from '../game/achievements';
import { calculateScore, getRank, type AchievementId } from '@mafia/shared';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export class RoomManager {
  private state: GameState;
  private io: Server;
  private roomCode: string;
  private get rolePreset(): string { return this.state.settings.rolePreset ?? 'classic'; }
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private playerSockets: Map<PlayerId, string> = new Map();
  private socketToPlayer: Map<string, PlayerId> = new Map();
  private disconnectedPlayers: Map<PlayerId, { name: string; role: Player['role']; team: string }> = new Map();
  private lastActivity: number = Date.now();

  constructor(io: Server, code?: string) {
    this.io = io;
    this.roomCode = code ?? generateRoomCode();
    this.state = createInitialState(generateId('game_'), this.roomCode);
  }

  get code(): string {
    return this.roomCode;
  }

  get stateSnapshot(): GameState {
    return structuredClone(this.state);
  }

  get playerCount(): number {
    return this.state.players.length;
  }

  isInactive(): boolean {
    return Date.now() - this.lastActivity > 3600000;
  }

  destroy(): void {
    this.clearTimer();
    this.io.to(this.roomCode).emit('game:end', {
      winner: 'cancelled',
      stats: { reason: 'room_closed' },
    });
  }

  private clearTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private broadcast() {
    this.io.to(this.roomCode).emit('state:sync', { state: this.state });
    this.lastActivity = Date.now();
  }

  private setPhaseTimer(durationMs: number, nextPhase: Phase) {
    this.clearTimer();
    this.phaseTimer = setTimeout(() => {
      this.transitionTo(nextPhase);
    }, durationMs);
  }

  private transitionTo(phase: Phase) {
    if (!canPhaseTransition(this.state.phase, phase)) return;
    const prevPhase = this.state.phase;

    const now = Date.now();
    let durationMs = 30000;

    switch (phase) {
      case 'night':
        durationMs = (this.state.settings.nightDuration ?? 30) * 1000;
        break;
      case 'day':
        durationMs = (this.state.settings.dayDuration ?? 60) * 1000;
        break;
      case 'voting':
        durationMs = (this.state.settings.votingDuration ?? 30) * 1000;
        break;
    }

    this.state = {
      ...this.state,
      phase,
      phaseStartedAt: now,
      phaseEndsAt: now + durationMs,
    };

    this.state = addEvent(this.state, 'phase_change', { from: prevPhase, to: phase });

    switch (phase) {
      case 'night':
        this.handleNight();
        break;
      case 'day':
        this.handleDay();
        break;
      case 'voting':
        this.handleVoting();
        break;
      case 'ended':
        this.handleGameEnd();
        return;
    }

    this.broadcast();
  }

  resetGame(): void {
    const players = this.state.players.map(p => ({
      ...p,
      role: null,
      team: 'town' as const,
      alive: true,
      disconnected: false,
      votedFor: null,
      nightAction: null,
      ready: p.isBot ? true : false,
    }));

    this.clearTimer();
    this.disconnectedPlayers.clear();
    this.state = {
      ...createInitialState(generateId('game_'), this.roomCode),
      players,
      settings: this.state.settings,
    };
    this.broadcast();
  }

  toggleReady(socketId: string): boolean {
    if (this.state.phase !== 'lobby') return false;
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return false;

    this.state = {
      ...this.state,
      players: this.state.players.map(p =>
        p.id === playerId ? { ...p, ready: !p.ready } : p
      ),
    };
    this.broadcast();
    return true;
  }

  updateSettings(settings: Partial<GameState['settings']>): void {
    if (this.state.phase !== 'lobby') return;
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...settings },
    };
    this.broadcast();
  }

  addBots(count: number): void {
    if (this.state.phase !== 'lobby') return;
    const existingPlayers = this.state.players.length;
    const maxPlayers = this.state.settings.maxPlayers ?? 12;
    const available = maxPlayers - existingPlayers;
    const actualCount = Math.min(count, available);
    if (actualCount <= 0) return;

    const names = getBotNames(actualCount).filter(n => !this.state.players.some(p => p.name === n));

    const botPlayers: Player[] = names.map(name => ({
      id: generateId('bot_') as PlayerId,
      name,
      avatar: 'dicebear',
      role: null,
      team: 'town',
      alive: true,
      disconnected: false,
      votedFor: null,
      nightAction: null,
      isBot: true,
      ready: true,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    }));

    this.state = {
      ...this.state,
      players: [...this.state.players, ...botPlayers],
    };

    for (const bot of botPlayers) {
      this.io.to(this.roomCode).emit('player:joined', { player: bot });
    }
    this.broadcast();
  }

  private scheduleBotNightActions() {
    const difficulty = getBotDifficulty();
    const aliveBots = this.state.players.filter(p => p.alive && p.isBot && p.role?.nightAction);

    for (const bot of aliveBots) {
      const delay = botGetNightActionDelay(difficulty);
      const botDifficulty = getBotDifficulty();

      setTimeout(() => {
        const currentState = this.state;
        if (currentState.phase !== 'night') return;

        const decision = botDecideNightAction(currentState, bot.id, botDifficulty);
        if (decision) {
          this.submitNightActionForBot(bot.id, decision.targetId, decision.action);
        }
      }, delay);
    }
  }

  private scheduleBotVotes() {
    const difficulty = getBotDifficulty();
    const aliveBots = this.state.players.filter(p => p.alive && p.isBot);

    for (const bot of aliveBots) {
      const delay = botGetVoteDelay(difficulty);
      const botDifficulty = getBotDifficulty();

      setTimeout(() => {
        const currentState = this.state;
        if (currentState.phase !== 'voting') return;

        const targetId = botDecideVote(currentState, bot.id, botDifficulty);
        if (targetId) {
          this.submitVoteForBot(bot.id, targetId);
        }
      }, delay);
    }
  }

  private submitNightActionForBot(botId: PlayerId, targetId: PlayerId, actionType: string): void {
    const player = this.state.players.find(p => p.id === botId);
    if (!player?.alive || this.state.phase !== 'night') return;

    const action: NightAction = {
      type: actionType as NightAction['type'],
      targetId,
      phaseDay: this.state.day,
    };

    this.state = {
      ...this.state,
      players: this.state.players.map(p =>
        p.id === botId ? { ...p, nightAction: action } : p
      ),
    };

    const aliveCount = getAlivePlayers(this.state).filter(p => !p.disconnected).length;
    const submittedCount = this.state.players.filter(
      p => p.alive && !p.disconnected && p.role?.nightAction && p.nightAction
    ).length;

    if (submittedCount >= aliveCount) {
      this.clearTimer();
      this.transitionTo('day');
    } else {
      this.broadcast();
    }
  }

  private submitVoteForBot(botId: PlayerId, targetId: PlayerId): void {
    const player = this.state.players.find(p => p.id === botId);
    if (!player?.alive || this.state.phase !== 'voting') return;
    if (this.state.votes.some(v => v.from === botId)) return;

    this.state = {
      ...this.state,
      votes: [...this.state.votes, { from: botId, to: targetId }],
      players: this.state.players.map(p =>
        p.id === botId ? { ...p, votedFor: targetId } : p
      ),
    };

    this.broadcast();

    const aliveCount = getAlivePlayers(this.state).filter(p => !p.disconnected).length;
    if (this.state.votes.length >= aliveCount) {
      this.clearTimer();
      this.resolveVotingPhase();
    }
  }

  private handleNight() {
    this.state = { ...this.state, day: this.state.day + 1 };

    if (!this.state.rolesAssigned) {
      this.state = assignRoles(this.state, this.rolePreset);
      this.state = { ...this.state, rolesAssigned: true };

      // Send mafia team info to each mafia member
      for (const mafiaId of this.state.mafiaIds) {
        const socketId = this.getSocketByPlayerId(mafiaId);
        if (socketId && !this.state.players.find(p => p.id === mafiaId)?.disconnected) {
          const teamMates = this.state.mafiaIds.filter(id => id !== mafiaId);
          this.io.to(socketId).emit('game:special', {
            type: 'mafia_team',
            members: teamMates.map(id => {
              const p = this.state.players.find(pl => pl.id === id);
              return p ? { id: p.id, name: p.name } : null;
            }).filter(Boolean),
          });
        }
      }

      // Send witch potion state
      const witchPlayer = this.state.players.find(p => p.role?.id === 'witch');
      if (witchPlayer) {
        const witchSocket = this.getSocketByPlayerId(witchPlayer.id);
        if (witchSocket) {
          this.io.to(witchSocket).emit('game:special', {
            type: 'witch_state',
            saveAvailable: !this.state.witchState?.savePotionUsed,
            killAvailable: !this.state.witchState?.killPotionUsed,
          });
        }
      }

      // Send lover pairing
      if (this.state.loverPair) {
        for (const loverId of this.state.loverPair) {
          const socketId = this.getSocketByPlayerId(loverId);
          const otherId = this.state.loverPair.find(id => id !== loverId);
          if (socketId && otherId) {
            const other = this.state.players.find(p => p.id === otherId);
            this.io.to(socketId).emit('game:special', {
              type: 'lover_paired',
              partner: other ? { id: other.id, name: other.name } : null,
            });
          }
        }
      }
    }

    this.state = {
      ...this.state,
      players: this.state.players.map(p => ({
        ...p,
        nightAction: null,
        votedFor: null,
      })),
      votes: [],
    };

    const durationMs = (this.state.settings.nightDuration ?? 30) * 1000;
    this.setPhaseTimer(durationMs, 'day');

    // Schedule bot night actions
    const hasBots = this.state.players.some(p => p.isBot && p.alive);
    if (hasBots) {
      setTimeout(() => this.scheduleBotNightActions(), 500);
    }
  }

  private handleDay() {
    const { state, killed } = resolveNightActions(this.state);
    this.state = state;

    for (const player of killed) {
      this.io.to(this.roomCode).emit('player:died', {
        playerId: player.id,
        role: player.role?.id ?? 'unknown',
        cause: 'night',
      });
    }

    this.state = addEvent(this.state, 'reveal', {
      killed: killed.map(p => ({ id: p.id, role: p.role?.id, name: p.name })),
    });

    const winner = this.checkAndHandleWin();
    if (winner) return;

    const durationMs = (this.state.settings.dayDuration ?? 60) * 1000;
    this.setPhaseTimer(durationMs, 'voting');
  }

  private handleVoting() {
    this.state = {
      ...this.state,
      votes: [],
      players: this.state.players.map(p => ({
        ...p,
        votedFor: null,
        nightAction: null,
      })),
      eliminated: [...this.state.eliminated],
    };

    const durationMs = (this.state.settings.votingDuration ?? 30) * 1000;
    this.setPhaseTimer(durationMs, 'night');

    // Schedule bot votes
    const hasBots = this.state.players.some(p => p.isBot && p.alive);
    if (hasBots) {
      setTimeout(() => this.scheduleBotVotes(), 500);
    }
  }

  private handleGameEnd() {
    this.clearTimer();
    const winner = this.state.winner ?? 'unknown';

    const killCounts = new Map<string, number>();
    for (const event of this.state.history) {
      if (event.type === 'kill' && typeof event.data === 'object' && event.data && 'killerId' in (event.data as Record<string, unknown>)) {
        const data = event.data as Record<string, unknown>;
        const killerId = data['killerId'] as string | undefined;
        if (killerId) {
          killCounts.set(killerId, (killCounts.get(killerId) ?? 0) + 1);
        }
      }
    }

    const witchSaved = this.state.history.some(
      (e) => e.type === 'heal' && e.data && typeof e.data === 'object' && (e.data as Record<string, unknown>)['healer'] === 'witch'
    );
    const witchKilled = this.state.history.some(
      (e) => e.type === 'kill' && e.data && typeof e.data === 'object' && (e.data as Record<string, unknown>)['killer'] === 'witch'
    );

    const storedPlayers = this.state.players.map(p => ({
      name: p.name,
      role: p.role?.id ?? 'unknown',
      team: p.team,
      alive: p.alive,
      survived: p.alive,
      isBot: p.isBot ?? false,
      kills: killCounts.get(p.id) ?? 0,
      daysSurvived: this.state.day - (p.role?.id ? 1 : 0),
    }));

    try {
      saveGame({
        id: this.state.id,
        roomCode: this.roomCode,
        startedAt: this.state.phaseStartedAt,
        endedAt: Date.now(),
        winner,
        dayCount: this.state.day,
        playerCount: this.state.players.length,
        duration: Date.now() - this.state.phaseStartedAt,
        rolePreset: this.rolePreset,
        players: storedPlayers,
      });

      // Update profiles & check achievements
      for (const player of this.state.players) {
        if (player.isBot) continue;
        const profile = getOrCreatePlayerProfile(player.name);
        profile.totalGames++;
        if (player.team === winner) {
          profile.totalWins++;
          profile.consecutiveWins++;
          if (profile.consecutiveWins > profile.bestWinStreak) {
            profile.bestWinStreak = profile.consecutiveWins;
          }
        } else {
          profile.consecutiveWins = 0;
        }
        if (player.alive) profile.totalSurvived++;
        profile.totalKills += killCounts.get(player.id) ?? 0;

        const roleKey = player.role?.id ?? 'unknown';
        const existing = profile.roleStats[roleKey] ?? { games: 0, wins: 0 };
        existing.games++;
        if (player.team === winner) existing.wins++;
        profile.roleStats[roleKey] = existing;

        const stored = storedPlayers.find((sp) => sp.name === player.name);
        const newGameEntry = {
          winner,
          role: roleKey,
          team: player.team,
          survived: player.alive,
          dayCount: this.state.day,
          startedAt: Date.now(),
        };
        profile.recentGames.push(newGameEntry);
        if (profile.recentGames.length > 20) {
          profile.recentGames = profile.recentGames.slice(-20);
        }

        // Progressive achievements
        const progressive = checkProgressiveAchievements(
          profile.totalGames,
          profile.totalWins,
          profile.achievements as AchievementId[]
        );

        // Game-specific achievements
        const gameAchievements = checkNewAchievements(
          {
            player: stored!,
            allPlayers: storedPlayers,
            winner,
            dayCount: this.state.day,
            playerTeamAliveCount: storedPlayers.filter(
              (sp) => sp.team === player.team && sp.alive
            ).length,
            witchSaved,
            witchKilled,
          },
          profile.achievements as AchievementId[]
        );

        const allNew = [...progressive, ...gameAchievements];
        if (allNew.length > 0) {
          profile.achievements = [...new Set([...profile.achievements, ...allNew])];
        }

        // Score
        profile.score = calculateScore({
          games: profile.totalGames,
          wins: profile.totalWins,
          kills: profile.totalKills,
          survivalRate: profile.totalGames > 0
            ? (profile.totalSurvived / profile.totalGames) * 100
            : 0,
        });

        savePlayerProfile(profile);

        // Send achievements to player
        if (allNew.length > 0) {
          const socketId = this.playerSockets.get(player.id);
          if (socketId) {
            const socket = this.io.sockets.sockets.get(socketId);
            socket?.emit('achievements:unlocked', {
              achievements: allNew,
              score: profile.score,
              rank: getRank(profile.score).name,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to save game:', err);
    }

    this.io.to(this.roomCode).emit('game:end', {
      winner,
      stats: { day: this.state.day, totalPlayers: this.state.players.length },
      players: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role?.id ?? 'unknown',
        team: p.team,
        alive: p.alive,
      })),
    });
    this.broadcast();
  }

  private checkAndHandleWin(): boolean {
    const winner = checkWinCondition(this.state);
    if (winner) {
      this.clearTimer();
      this.state = { ...this.state, winner, phase: 'ended' };
      this.handleGameEnd();
      return true;
    }
    return false;
  }

  // --- Player Management ---

  addPlayer(socket: Socket, name: string): { success: boolean; player?: Player; error?: string } {
    // Try reconnection first
    if (this.state.phase !== 'lobby') {
      const existingPlayer = this.state.players.find(p => p.name === name && p.disconnected);
      if (existingPlayer) {
        socket.join(this.roomCode);
        socket.data.roomId = this.roomCode;
        this.playerSockets.set(existingPlayer.id, socket.id);
        this.socketToPlayer.set(socket.id, existingPlayer.id);
        this.disconnectedPlayers.delete(existingPlayer.id);
        this.state = {
          ...this.state,
          players: this.state.players.map(p =>
            p.id === existingPlayer.id ? { ...p, disconnected: false, lastActiveAt: Date.now() } : p
          ),
        };
        this.broadcast();
        return { success: true, player: existingPlayer };
      }
    }

    if (this.state.phase !== 'lobby') {
      return { success: false, error: 'Game already in progress' };
    }
    if (this.state.players.length >= (this.state.settings.maxPlayers ?? 12)) {
      return { success: false, error: 'Room is full' };
    }
    if (this.state.players.some(p => p.name === name && !p.disconnected)) {
      return { success: false, error: 'Name already taken' };
    }

    const player: Player = {
      id: generateId('p_') as PlayerId,
      name,
      avatar: 'dicebear',
      role: null,
      team: 'town',
      alive: true,
      disconnected: false,
      votedFor: null,
      nightAction: null,
      isBot: false,
      ready: false,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    this.state = {
      ...this.state,
      players: [...this.state.players, player],
    };

    socket.join(this.roomCode);
    socket.data.roomId = this.roomCode;
    this.playerSockets.set(player.id, socket.id);
    this.socketToPlayer.set(socket.id, player.id);
    this.state = addEvent(this.state, 'reveal', { playerJoined: player.id });
    this.broadcast();
    this.io.to(this.roomCode).emit('player:joined', { player });

    return { success: true, player };
  }

  removePlayer(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    this.playerSockets.delete(playerId);
    this.socketToPlayer.delete(socketId);

    if (this.state.phase === 'lobby') {
      this.state = {
        ...this.state,
        players: this.state.players.filter(p => p.id !== playerId),
      };
    } else {
      const player = this.state.players.find(p => p.id === playerId);
      if (player) {
        this.disconnectedPlayers.set(playerId, {
          name: player.name,
          role: player.role ? { ...player.role } : null,
          team: player.team,
        });
      }
      this.state = {
        ...this.state,
        players: this.state.players.map(p =>
          p.id === playerId ? { ...p, disconnected: true } : p
        ),
      };
    }

    this.io.to(this.roomCode).emit('player:left', { playerId });
    this.broadcast();

    if (this.state.phase !== 'lobby') {
      this.checkAndHandleWin();
    }
  }

  getPlayerIdBySocket(socketId: string): PlayerId | undefined {
    return this.socketToPlayer.get(socketId);
  }

  getSocketByPlayerId(playerId: PlayerId): string | undefined {
    return this.playerSockets.get(playerId);
  }

  // --- Game Actions ---

  startGame(socketId: string): { success: boolean; error?: string } {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return { success: false, error: 'Not in room' };

    if (this.state.phase !== 'lobby') {
      return { success: false, error: 'Game already started' };
    }

    const aliveCount = this.state.players.filter(p => p.alive && !p.disconnected).length;
    if (aliveCount < (this.state.settings.minPlayers ?? 4)) {
      return { success: false, error: 'Not enough players' };
    }

    const unreadyPlayers = this.state.players.filter(p => p.alive && !p.disconnected && !p.ready && !p.isBot);
    if (unreadyPlayers.length > 0) {
      return { success: false, error: `Waiting for ${unreadyPlayers.length} player(s) to ready up` };
    }

    this.transitionTo('night');
    return { success: true };
  }

  submitNightAction(socketId: string, targetId: PlayerId, actionType: string): { success: boolean; error?: string } {
    if (this.state.phase !== 'night') {
      return { success: false, error: 'Not night phase' };
    }

    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return { success: false, error: 'Not in room' };

    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.alive) return { success: false, error: 'You are dead' };
    if (!player.role?.nightAction && !['witch_save', 'witch_kill'].includes(actionType)) {
      return { success: false, error: 'You have no night action' };
    }

    // Witch can save or kill (two separate action types)
    if (actionType === 'witch_save' || actionType === 'witch_kill') {
      if (player.role?.id !== 'witch') {
        return { success: false, error: 'Only the witch can use potions' };
      }
      if (actionType === 'witch_save' && this.state.witchState?.savePotionUsed) {
        return { success: false, error: 'Save potion already used' };
      }
      if (actionType === 'witch_kill' && this.state.witchState?.killPotionUsed) {
        return { success: false, error: 'Kill potion already used' };
      }
    }

    const action: NightAction = {
      type: actionType as NightAction['type'],
      targetId,
      phaseDay: this.state.day,
    };

    this.state = {
      ...this.state,
      players: this.state.players.map(p =>
        p.id === playerId ? { ...p, nightAction: action } : p
      ),
    };

    const aliveCount = getAlivePlayers(this.state).filter(p => !p.disconnected).length;
    const submittedCount = this.state.players.filter(
      p => p.alive && !p.disconnected && p.role?.nightAction && p.nightAction
    ).length;

    if (submittedCount >= aliveCount) {
      this.clearTimer();
      this.transitionTo('day');
    } else {
      this.broadcast();
    }

    return { success: true };
  }

  submitVote(socketId: string, targetId: PlayerId): { success: boolean; error?: string } {
    if (this.state.phase !== 'voting') {
      return { success: false, error: 'Not voting phase' };
    }

    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return { success: false, error: 'Not in room' };

    const player = this.state.players.find(p => p.id === playerId);
    if (!player?.alive) return { success: false, error: 'You are dead' };
    if (this.state.votes.some(v => v.from === playerId)) {
      return { success: false, error: 'Already voted' };
    }

    const targetExists = this.state.players.some(p => p.id === targetId && p.alive);
    if (!targetExists) return { success: false, error: 'Invalid target' };

    this.state = {
      ...this.state,
      votes: [...this.state.votes, { from: playerId, to: targetId }],
      players: this.state.players.map(p =>
        p.id === playerId ? { ...p, votedFor: targetId } : p
      ),
    };

    this.io.to(this.roomCode).emit('vote:cast', { from: playerId, to: targetId });
    this.broadcast();

    const aliveCount = getAlivePlayers(this.state).filter(p => !p.disconnected).length;
    if (this.state.votes.length >= aliveCount) {
      this.clearTimer();
      this.resolveVotingPhase();
    }

    return { success: true };
  }

  private resolveVotingPhase() {
    const { state, eliminated } = resolveVotes(this.state);
    this.state = state;

    if (eliminated) {
      this.io.to(this.roomCode).emit('vote:result', {
        eliminated: eliminated.id,
        votes: [...state.votes],
      });

      this.io.to(this.roomCode).emit('player:died', {
        playerId: eliminated.id,
        role: eliminated.role?.id ?? 'unknown',
        cause: 'lynch',
      });

      if (eliminated.role?.id === 'jester') {
        this.io.to(this.roomCode).emit('game:event', {
          type: 'jester_win',
          message: `${eliminated.name} (Jester) was lynched and wins!`,
        });
      }
    }

    const winner = this.checkAndHandleWin();
    if (winner) return;

    this.transitionTo('night');
  }

  addMafiaChatMessage(socketId: string, text: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || (player.team !== 'mafia' && player.role?.id !== 'godfather')) return;

    const mafiaIds = this.state.mafiaIds ?? this.state.players
      .filter(p => p.team === 'mafia')
      .map(p => p.id);

    for (const mid of mafiaIds) {
      const sid = this.playerSockets.get(mid);
      if (sid) {
        this.io.to(sid).emit('chat:mafia', {
          from: playerId,
          name: player.name,
          text,
          timestamp: Date.now(),
        });
      }
    }
  }

  addChatMessage(socketId: string, text: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    this.io.to(this.roomCode).emit('chat:message', {
      from: playerId,
      name: player.name,
      text,
      timestamp: Date.now(),
    });
  }
}
