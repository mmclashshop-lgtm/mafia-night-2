import { useRef, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { renderNightCity } from './nightCity';
import { renderNightSky } from './nightSky';
import { renderDayTown } from './dayTown';
import { renderCourtroom } from './courtroom';
import { renderTheater } from './theater';
import type { BgRenderer } from './canvas';

export function BackgroundSystem({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetBg: BgRenderer = renderNightCity;
    const isGamePage = location.pathname === '/game';
    if (isGamePage) {
      if (phase === 'ended') targetBg = renderTheater;
      else if (phase === 'night') targetBg = renderNightSky;
      else if (phase === 'day') targetBg = renderDayTown;
      else if (phase === 'voting') targetBg = renderCourtroom;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    targetBg(ctx, w, h, 0, 0, 0, 1);
  }, [location.pathname, phase]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="fixed inset-0 bg-ambient pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}