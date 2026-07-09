import { drawGradient, drawGlow } from './canvas';
import type { BgRenderer } from './canvas';

export const renderTheater: BgRenderer = (ctx, w, h, time, _mx, _my, alpha) => {
  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(30,5,5,1)' },
    { offset: 0.3, color: 'rgba(80,10,10,1)' },
    { offset: 0.7, color: 'rgba(139,0,0,0.8)' },
    { offset: 1, color: 'rgba(10,3,3,1)' },
  ], alpha);

  const spotX = w * 0.5 + Math.sin(time * 0.1) * 80;
  const spotY = h * 0.15;

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5 - 0.5) * 0.8;
    const g = ctx.createRadialGradient(
      spotX, spotY, 0,
      spotX + Math.sin(angle) * w * 0.3, spotY + h * 0.1,
      w * 0.2
    );
    g.addColorStop(0, `rgba(255,255,200,${0.15 - i * 0.025})`);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(spotX + Math.sin(angle) * w * 0.2, spotY + h * 0.1, w * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawGlow(ctx, spotX, spotY, 200, 'rgba(255,255,200,0.25)', alpha);
  drawGlow(ctx, spotX, spotY, 100, 'rgba(255,255,200,0.35)', alpha);

  const glitterCount = 40;
  for (let i = 0; i < glitterCount; i++) {
    const gx = ((i * 137 + Math.sin(time * 2 + i) * 50) % w);
    const gy = ((i * 251 + Math.cos(time * 1.5 + i) * 30) % h);
    const bright = 0.3 + Math.sin(time * 3 + i * 1.7) * 0.3;
    ctx.globalAlpha = bright * alpha * 0.3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(gx, gy, 1 + Math.sin(time * 2 + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let side = 0; side < 2; side++) {
    const sx = side === 0 ? 0 : w;
    const g = ctx.createRadialGradient(sx, h * 0.3, 0, sx, h * 0.3, w * 0.25);
    g.addColorStop(0, `rgba(139,0,0,${0.3 * alpha})`);
    g.addColorStop(0.5, `rgba(100,0,0,${0.15 * alpha})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (side === 0) {
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(w * 0.18, h * 0.3, 0, h);
    } else {
      ctx.moveTo(w, 0);
      ctx.quadraticCurveTo(w * 0.82, h * 0.3, w, h);
    }
    ctx.lineTo(side === 0 ? 0 : w, side === 0 ? h : 0);
    ctx.fill();
  }

  ctx.globalAlpha = 0.08 * alpha;
  ctx.fillStyle = '#ffd700';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 67) % w;
    const sy = (i * 43) % h;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};
