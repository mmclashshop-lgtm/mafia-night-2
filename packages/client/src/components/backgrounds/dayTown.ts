import { drawGradient, drawClouds, drawSun, drawSunRays, drawCitySilhouette, drawFog } from './canvas';
import type { BgRenderer } from './canvas';

export const renderDayTown: BgRenderer = (ctx, w, h, time, mx, my, alpha) => {
  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(80,170,255,1)' },
    { offset: 0.25, color: 'rgba(120,200,240,1)' },
    { offset: 0.5, color: 'rgba(160,210,235,1)' },
    { offset: 0.75, color: 'rgba(220,190,150,0.8)' },
    { offset: 1, color: 'rgba(255,200,100,0.5)' },
  ], alpha);

  drawSunRays(ctx, w, h, time, alpha);
  drawSun(ctx, w + mx * 20, h * 0.15 + my * 10, time, alpha);
  drawClouds(ctx, w, h, time, 0.8 * alpha, 'rgba(255,255,255,0.6)');

  drawCitySilhouette(ctx, w, h, 0.3 * alpha, '#3d4a5c');

  drawFog(ctx, w, h, time, 0.03 * alpha, '#ffd700');

  ctx.globalAlpha = 0.15 * alpha;
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, h * 0.85, w, h * 0.15);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = `rgba(50,50,50,${0.25 * alpha})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const bx = ((i * 200 + time * 30 * (1 + i * 0.2)) % (w + 100)) - 50;
    const by = h * 0.08 + i * 15 + Math.sin(time + i) * 5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 5, by - 5, bx + 10, by);
    ctx.quadraticCurveTo(bx + 15, by - 5, bx + 20, by);
    ctx.stroke();
  }
};
