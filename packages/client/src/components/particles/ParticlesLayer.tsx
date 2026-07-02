import { useEffect, useRef, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';

type ParticleConfig = {
  count: number;
  color: string;
  size: [number, number];
  speed: number;
  opacity: [number, number];
  shape: 'circle' | 'star' | 'diamond';
};

const SCENE_CONFIGS: Record<string, ParticleConfig> = {
  home: {
    count: 30,
    color: '#8B0000',
    size: [1, 3],
    speed: 0.3,
    opacity: [0.1, 0.4],
    shape: 'circle',
  },
  night: {
    count: 50,
    color: '#dda0dd',
    size: [1, 3],
    speed: 0.2,
    opacity: [0.15, 0.5],
    shape: 'circle',
  },
  day: {
    count: 25,
    color: '#ffd700',
    size: [1, 2],
    speed: 0.4,
    opacity: [0.1, 0.3],
    shape: 'circle',
  },
  voting: {
    count: 20,
    color: '#ff6b35',
    size: [2, 4],
    speed: 0.5,
    opacity: [0.1, 0.3],
    shape: 'diamond',
  },
  death: {
    count: 40,
    color: '#ff0000',
    size: [1, 4],
    speed: 0.6,
    opacity: [0.1, 0.4],
    shape: 'star',
  },
  win: {
    count: 60,
    color: '#ffd700',
    size: [2, 5],
    speed: 0.8,
    opacity: [0.2, 0.6],
    shape: 'star',
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacitySpeed: number;
  shape: string;
}

export const ParticlesLayer = memo(function ParticlesLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const location = useLocation();
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;
  const isHome = location.pathname === '/';
  const isGamePage = location.pathname === '/game';

  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    let config: ParticleConfig;
    if (isHome) {
      config = SCENE_CONFIGS.home;
    } else if (isGamePage) {
      if (phase === 'ended') config = SCENE_CONFIGS.win;
      else if (phase === 'night') config = SCENE_CONFIGS.night;
      else if (phase === 'day') config = SCENE_CONFIGS.day;
      else if (phase === 'voting') config = SCENE_CONFIGS.voting;
      else config = SCENE_CONFIGS.home;
    } else {
      config = SCENE_CONFIGS.home;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: config.count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: -Math.random() * config.speed - 0.1,
      size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
      opacity: config.opacity[0] + Math.random() * (config.opacity[1] - config.opacity[0]),
      opacitySpeed: 0.002 + Math.random() * 0.005,
      shape: config.shape,
    }));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacitySpeed;

        if (p.opacity >= config.opacity[1] || p.opacity <= config.opacity[0]) {
          p.opacitySpeed *= -1;
        }

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y > canvas.height + 10) {
          p.y = -10;
        }

        ctx.beginPath();
        ctx.fillStyle = config.color;
        ctx.globalAlpha = p.opacity;

        if (p.shape === 'star') {
          const spikes = 4;
          const outerR = p.size;
          const innerR = p.size / 2;
          for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            (ctx as any)[method](p.x + r * Math.cos(angle), p.y + r * Math.sin(angle));
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'diamond') {
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [location.pathname, phase, isHome, isGamePage]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
});
