import { useEffect, useRef } from 'react';
import { sound } from '../lib/sound';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';

export function useSound() {
  const gameState = useGameStore((s) => s.gameState);
  const prevPhase = useRef(gameState?.phase);
  const prevDay = useRef(gameState?.day);

  useEffect(() => {
    if (!gameState) return;
    const phase = gameState.phase;
    const prev = prevPhase.current;

    if (prev && prev !== phase) {
      sound.stopAmbient();

      if (phase === 'night') {
        sound.nightStart();
      } else if (phase === 'day') {
        if (prev === 'night') sound.nightEnd();
        setTimeout(() => sound.dayStart(), 600);
      } else if (phase === 'voting') {
        if (prev === 'night') sound.nightEnd();
        setTimeout(() => sound.phaseChange(), 600);
      } else if (phase === 'ended') {
        if (prev === 'night') sound.nightEnd();
        setTimeout(() => {
          if (gameState.winner === 'mafia') {
            sound.mafiaWin();
          } else if (gameState.winner === 'neutral') {
            sound.jesterWin();
          } else {
            sound.townWin();
          }
          setTimeout(() => sound.gameEnd(), 1500);
        }, 600);
      }
    }

    prevPhase.current = phase;
  }, [gameState?.phase, gameState?.winner]);

  useEffect(() => {
    if (gameState && gameState.day !== prevDay.current && gameState.day > 0) {
      prevDay.current = gameState.day;
    }
  }, [gameState?.day]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('player:died', (data: { cause?: string }) => {
      if (data.cause === 'lynch') {
        sound.lynch();
      } else {
        sound.playerDied();
      }
    });

    socket.on('vote:cast', () => {
      sound.voteCast();
    });

    socket.on('vote:result', () => {
      sound.voteResult();
    });

    socket.on('game:event', (event: { type: string }) => {
      if (event.type === 'role_reveal') {
        sound.roleReveal();
      } else if (event.type === 'lovers_death') {
        sound.loversDeath();
      }
    });

    return () => {
      socket.off('player:died');
      socket.off('vote:cast');
      socket.off('vote:result');
      socket.off('game:event');
    };
  }, []);
}
