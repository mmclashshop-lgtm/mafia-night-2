import { drawGradient, drawGlow } from './canvas';
import type { BgRenderer } from './canvas';

export const renderCourtroom: BgRenderer = (ctx, w, h, time, mx, my, alpha) => {
  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(60,20,10,1)' },
    { offset: 0.4, color: 'rgba(100,40,20,1)' },
    { offset: 0.7, color: 'rgba(80,25,12,1)' },
    { offset: 1, color: 'rgba(30,10,5,1)' },
  ], alpha);

  // Moving spotlights
  drawGlow(ctx, w * 0.2 + mx * 15, h * 0.08 + my * 8, 300, 'rgba(255,200,100,0.15)', alpha * (0.7 + Math.sin(time) * 0.1));
  drawGlow(ctx, w * 0.5 + mx * 10, h * 0.05 + my * 5, 350, 'rgba(255,200,100,0.2)', alpha * (0.7 + Math.sin(time * 0.8) * 0.1));
  drawGlow(ctx, w * 0.8 + mx * 12, h * 0.08 + my * 6, 300, 'rgba(255,200,100,0.15)', alpha * (0.7 + Math.sin(time * 1.2) * 0.1));

  // Bench rows
  ctx.globalAlpha = 0.25 * alpha;
  ctx.fillStyle = '#5c2e16';
  for (let x = 0; x < w; x += w / 8) {
    ctx.fillRect(x, h * 0.6, w / 8 - 4, h * 0.4);
  }
  ctx.globalAlpha = 1;

  // Judge bench
  ctx.globalAlpha = 0.18 * alpha;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, h * 0.75, w, h * 0.25);
  ctx.globalAlpha = 1;

  // Bench posts
  ctx.globalAlpha = 0.1 * alpha;
  ctx.fillStyle = '#a0522d';
  for (let x = 0; x < w; x += 120) {
    ctx.fillRect(x, h * 0.6, 4, h * 0.15);
  }
  ctx.globalAlpha = 1;

  // Red curtains
  const curtainColor = 'rgba(139,0,0,0.15)';
  ctx.globalAlpha = alpha;
  for (let side = 0; side < 2; side++) {
    const cx = side === 0 ? 0 : w;
    const g = ctx.createRadialGradient(cx, h * 0.3, 0, cx, h * 0.3, w * 0.25);
    g.addColorStop(0, curtainColor);
    g.addColorStop(0.5, 'rgba(139,0,0,0.05)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (side === 0) {
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w * 0.15, h * 0.3, 0, h);
    } else {
      ctx.moveTo(w, 0);
      ctx.quadraticCurveTo(w * 0.85, h * 0.3, w, h);
    }
    ctx.lineTo(side === 0 ? 0 : w, side === 0 ? h : 0);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Gold decorative border
  ctx.strokeStyle = `rgba(255,215,0,${0.12 * alpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
  ctx.strokeStyle = `rgba(255,215,0,${0.06 * alpha})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
};
