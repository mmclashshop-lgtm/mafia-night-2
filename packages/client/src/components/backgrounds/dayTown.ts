import { drawGradient, drawClouds, drawSun, drawSunRays, drawCitySilhouette, drawFog } from './canvas';
import type { BgRenderer } from './canvas';

export const renderDayTown: BgRenderer = (ctx, w, h, time, mx, my, alpha) => {
  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(100,180,255,1)' },
    { offset: 0.25, color: 'rgba(135,206,235,1)' },
    { offset: 0.5, color: 'rgba(173,216,230,1)' },
    { offset: 0.75, color: 'rgba(210,180,140,0.7)' },
    { offset: 1, color: 'rgba(255,200,100,0.4)' },
  ], alpha);

  drawSunRays(ctx, w, h, time, alpha);
  drawSun(ctx, w + mx * 20, h * 0.15 + my * 10, time, alpha);
  drawClouds(ctx, w, h, time, 0.6 * alpha, 'rgba(255,255,255,0.5)');

  drawCitySilhouette(ctx, w, h, 0.2 * alpha, '#4a5568');

  drawFog(ctx, w, h, time, 0.015 * alpha, '#ffd700');

  // Golden ground glow
  ctx.globalAlpha = 0.1 * alpha;
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, h * 0.85, w, h * 0.15);
  ctx.globalAlpha = 1;

  // Birds
  ctx.strokeStyle = `rgba(50,50,50,${0.15 * alpha})`;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 200 + time * 30 * (1 + i * 0.2)) % (w + 100)) - 50;
    const by = h * 0.08 + i * 15 + Math.sin(time + i) * 5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 5, by - 4, bx + 10, by);
    ctx.quadraticCurveTo(bx + 15, by - 4, bx + 20, by);
    ctx.stroke();
  }
};
