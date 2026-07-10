import { useEffect, useRef } from 'react';
import { sound, setSoundMuted } from '../lib/sound';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { useSoundStore } from '../store/soundStore';

export function useSound() {
  const muted = useSoundStore((s) => s.muted);
  const gameState = useGameStore((s) => s.gameState);
  const prevPhase = useRef(gameState?.phase);
  const prevDay = useRef(gameState?.day);

  useEffect(() => {
    setSoundMuted(muted);
  }, [muted]);

  // Phase transitions
  useEffect(() => {
    if (!gameState) return;
    const phase = gameState.phase;
    const prev = prevPhase.current;

    if (prev && prev !== phase) {
      sound.nightFall();
      if (phase === 'night' && (prev === 'day' || prev === 'voting')) {
        sound.nightStart();
        setTimeout(() => sound.nightFall(), 100);
      } else if (phase === 'day' && prev === 'night') {
        sound.nightEnd();
        setTimeout(() => { sound.dayStart(); sound.dayBreak(); }, 600);
      } else if (phase === 'voting' && (prev === 'day' || prev === 'night')) {
        sound.nightEnd();
        setTimeout(() => sound.voteStart(), 400);
      } else if (phase === 'ended') {
        sound.nightEnd();
        setTimeout(() => {
          const winner = gameState.winner;
          if (winner === 'mafia') sound.mafiaWin();
          else if (winner === 'neutral') sound.jesterWin();
          else sound.townWin();
          setTimeout(() => sound.gameEnd(), 1500);
        }, 600);
      } else if (phase === 'lobby') {
        sound.stopAmbient();
      }
    }

    prevPhase.current = phase;
  }, [gameState?.phase, gameState?.winner]);

  // Track day changes for potential effects
  useEffect(() => {
    if (gameState && gameState.day !== prevDay.current && gameState.day > 0) {
      prevDay.current = gameState.day;
    }
  }, [gameState?.day]);

  // Socket events
  useEffect(() => {
    const socket = getSocket();

    const onPlayerDied = (data: { cause?: string; playerId?: string }) => {
      if (data.cause === 'lynch') {
        sound.lynch();
      } else if (data.cause === 'night') {
        sound.mafiaKill();
      } else {
        sound.playerDied();
      }
    };

    const onVoteCast = () => {
      sound.voteCast();
    };

    const onVoteResult = () => {
      sound.voteResult();
    };

    const onGameEvent = (event: { type: string; data?: any }) => {
      switch (event.type) {
        case 'role_reveal':
          sound.roleReveal();
          break;
        case 'lovers_death':
          sound.loversDeath();
          break;
        case 'heal':
          sound.heal();
          break;
        case 'investigate':
          sound.investigate();
          break;
        case 'jester_win':
          sound.jesterWin();
          break;
      }
    };

    const onPlayerJoined = () => {
      sound.notification();
    };

    const onPlayerLeft = () => {
      sound.error();
    };

    const onChatMessage = (data: { chatType?: string }) => {
      sound.chatMessage(data.chatType === 'mafia');
    };

    const onMatchFound = () => {
      sound.matchFound();
    };

    const onGameRewards = (data: { coins?: number; xp?: number; newAchievements?: string[]; newLevel?: number }) => {
      if (data.coins && data.coins > 0) setTimeout(() => sound.coinEarn(), 500);
      if (data.newAchievements && data.newAchievements.length > 0) {
        setTimeout(() => sound.achievement(), 1500);
      }
      if (data.newLevel) setTimeout(() => sound.levelUp(), 2500);
    };

    const onGameStart = () => {
      sound.gameStart();
    };

    const onError = () => {
      sound.error();
    };

    const onSpecial = (data: { type: string }) => {
      if (data.type === 'investigation' || data.type === 'role-check') {
        sound.investigate();
      }
    };

    socket.on('player:died', onPlayerDied);
    socket.on('vote:cast', onVoteCast);
    socket.on('vote:result', onVoteResult);
    socket.on('game:event', onGameEvent);
    socket.on('player:joined', onPlayerJoined);
    socket.on('player:left', onPlayerLeft);
    socket.on('chat:message', onChatMessage);
    socket.on('matchmaking:found', onMatchFound);
    socket.on('game:rewards', onGameRewards);
    socket.on('game:start', onGameStart);
    socket.on('error', onError);
    socket.on('game:special', onSpecial);

    return () => {
      socket.off('player:died', onPlayerDied);
      socket.off('vote:cast', onVoteCast);
      socket.off('vote:result', onVoteResult);
      socket.off('game:event', onGameEvent);
      socket.off('player:joined', onPlayerJoined);
      socket.off('player:left', onPlayerLeft);
      socket.off('chat:message', onChatMessage);
      socket.off('matchmaking:found', onMatchFound);
      socket.off('game:rewards', onGameRewards);
      socket.off('game:start', onGameStart);
      socket.off('error', onError);
      socket.off('game:special', onSpecial);
    };
  }, []);

  return { sound };
}
