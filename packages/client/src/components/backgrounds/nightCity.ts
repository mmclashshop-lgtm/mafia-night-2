import { makeStars, drawStars, drawMoon, drawGradient, drawFog, drawWindows, makeWindowLights, drawCitySilhouette, drawGlow } from './canvas';
import type { BgRenderer } from './canvas';

let stars: ReturnType<typeof makeStars> | null = null;
let windows: ReturnType<typeof makeWindowLights> | null = null;

export const renderNightCity: BgRenderer = (ctx, w, h, time, mx, my, alpha) => {
  if (!stars || stars.length === 0) {
    stars = makeStars(120, w, h, h * 0.5);
    windows = makeWindowLights(60, w, h * 0.35, h * 0.55);
  }

  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(15,12,41,1)' },
    { offset: 0.3, color: 'rgba(35,25,60,1)' },
    { offset: 0.6, color: 'rgba(25,40,70,0.95)' },
    { offset: 1, color: 'rgba(10,8,20,1)' },
  ], alpha);

  drawStars(ctx, stars!, time, alpha);

  drawMoon(ctx, w * 0.75, h * 0.15, 60, alpha, time);

  drawGlow(ctx, w * 0.4, h * 0.5, w * 0.8, 'rgba(139,0,0,0.06)', alpha);
  drawGlow(ctx, w * 0.6 + mx * 20, h * 0.3 + my * 15, w * 0.3, 'rgba(255,215,0,0.04)', alpha);

  drawCitySilhouette(ctx, w, h, 0.5 * alpha, '#0a0a14');

  drawWindows(ctx, windows!, time, alpha);

  ctx.strokeStyle = `rgba(180,200,255,${0.1 * alpha})`;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 50; i++) {
    const rx = ((i * 137 + time * 120 * (1 + (i % 3) * 0.3)) % w);
    const ry = ((i * 251 + time * 200 * (1 + (i % 2) * 0.5)) % (h * 0.8));
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 4, ry + 22);
    ctx.stroke();
  }

  drawFog(ctx, w, h, time, 0.04 * alpha, '#8B0000');

  ctx.globalAlpha = 0.5 * alpha;
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = `rgba(139,0,0,${0.25 * alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  ctx.lineTo(w, h * 0.7);
  ctx.stroke();
};
