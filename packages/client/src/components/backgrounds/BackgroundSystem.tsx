import { useRef, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { getBgRenderer } from './bgRegistry';

function getBgKey(path: string, phase: string | undefined, _bgConfig: Record<string, string>): string {
  if (path === '/game') {
    if (phase === 'ended') return 'gameEnded';
    if (phase === 'night') return 'gameNight';
    if (phase === 'day') return 'gameDay';
    if (phase === 'voting') return 'gameVoting';
    return 'gameDefault';
  }
  if (path === '/lobby') return 'lobby';
  return 'home';
}

export function BackgroundSystem({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;
  const bgConfig = useSiteConfigStore((s) => s.config.backgrounds);
  const bgImages = useSiteConfigStore((s) => s.config.bgImages);
  const [imgError, setImgError] = useState(false);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const bgKey = getBgKey(location.pathname, phase, bgConfig);
  const imageUrl = bgImages[bgKey as keyof typeof bgImages]?.trim() || '';
  const rendererKey = bgConfig[bgKey as keyof typeof bgConfig] || 'nightCity';

  useEffect(() => {
    setImgError(false);
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setImgError(false);
    img.onerror = () => setImgError(true);
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (imageUrl && !imgError) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };
    resize();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 };
    };
    window.addEventListener('mousemove', onMouse);

    const renderFn = getBgRenderer(rendererKey);

    let raf: number;
    const loop = (t: number) => {
      timeRef.current = t / 1000;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      renderFn(ctx, w, h, timeRef.current, mouseRef.current.x, mouseRef.current.y, 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [rendererKey, imageUrl, imgError]);

  const useImage = !!imageUrl && !imgError;

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {useImage ? (
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <canvas ref={canvasRef} className="fixed inset-0" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
