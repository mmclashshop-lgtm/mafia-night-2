import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { NightCity } from './NightCity';
import { NightSky } from './NightSky';
import { DayTown } from './DayTown';
import { Courtroom } from './Courtroom';
import { Theater } from './Theater';
import { ParticlesLayer } from '../particles/ParticlesLayer';

export function BackgroundSystem({ children }: { children: ReactNode }) {
  const location = useLocation();
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;
  const isGamePage = location.pathname === '/game';
  const isEnded = phase === 'ended';

  let Background = NightCity;

  if (isGamePage) {
    if (isEnded) {
      Background = Theater;
    } else if (phase === 'night') {
      Background = NightSky;
    } else if (phase === 'day') {
      Background = DayTown;
    } else if (phase === 'voting') {
      Background = Courtroom;
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Background />
      </div>
      <ParticlesLayer />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
