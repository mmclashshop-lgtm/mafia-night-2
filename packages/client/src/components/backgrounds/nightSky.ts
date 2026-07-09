import { makeStars, drawStars, drawMoon, drawGradient, drawFog, drawGlow } from './canvas';
import type { BgRenderer } from './canvas';

let stars: ReturnType<typeof makeStars> | null = null;

export const renderNightSky: BgRenderer = (ctx, w, h, time, mx, my, alpha) => {
  if (!stars || stars.length === 0) {
    stars = makeStars(200, w, h, h * 0.7);
  }

  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(50,30,110,1)' },
    { offset: 0.25, color: 'rgba(35,15,80,1)' },
    { offset: 0.5, color: 'rgba(22,10,55,1)' },
    { offset: 1, color: 'rgba(8,6,20,1)' },
  ], alpha);

  drawGlow(ctx, w * 0.5 + mx * 15, h * 0.18 + my * 10, 500, 'rgba(60,35,120,0.6)', alpha);
  drawGlow(ctx, w * 0.3 + mx * 10, h * 0.35 + my * 8, 350, 'rgba(139,0,0,0.12)', alpha);
  drawGlow(ctx, w * 0.7 + mx * 12, h * 0.25 + my * 10, 300, 'rgba(100,0,150,0.1)', alpha);

  drawStars(ctx, stars!, time, alpha);

  drawMoon(ctx, w * 0.55 + mx * 5, h * 0.18 + my * 5, 90, alpha, time);

  const shootingStarPhase = time % 10;
  if (shootingStarPhase > 1 && shootingStarPhase < 1.5) {
    const progress = (shootingStarPhase - 1) / 0.5;
    const sx = w * 0.3 + progress * w * 0.4;
    const sy = h * 0.1 + progress * h * 0.25;
    ctx.globalAlpha = (1 - progress) * 0.8 * alpha;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 30, sy + 20);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const cx = 400 + mx * 30 + Math.sin(time * 0.08) * 100;
  ctx.globalAlpha = 0.06 * alpha;
  drawGlow(ctx, cx, 180, 400, '#dda0dd', alpha * 0.06);
  drawGlow(ctx, w - cx + my * 20, 250, 350, '#8B0000', alpha * 0.06);
  ctx.globalAlpha = 1;

  drawFog(ctx, w, h, time, 0.06 * alpha, '#4a0080');

  ctx.globalAlpha = 0.2 * alpha;
  ctx.fillStyle = 'rgba(74,0,128,0.06)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
};
