import { makeStars, drawStars, drawMoon, drawGradient, drawFog, drawWindows, makeWindowLights, drawCitySilhouette, drawGlow } from './canvas';
import type { BgRenderer } from './canvas';

let stars: ReturnType<typeof makeStars> | null = null;
let windows: ReturnType<typeof makeWindowLights> | null = null;

export const renderNightCity: BgRenderer = (ctx, w, h, time, mx, my, alpha) => {
  if (!stars || stars.length === 0) {
    stars = makeStars(90, w, h, h * 0.5);
    windows = makeWindowLights(50, w, h * 0.35, h * 0.55);
  }

  drawGradient(ctx, w, h, [
    { offset: 0, color: 'rgba(15,12,41,1)' },
    { offset: 0.35, color: 'rgba(26,26,46,1)' },
    { offset: 0.7, color: 'rgba(22,33,62,0.9)' },
    { offset: 1, color: 'rgba(10,8,20,1)' },
  ], alpha);

  drawStars(ctx, stars!, time, alpha);

  drawMoon(ctx, w * 0.75, h * 0.15, 50, alpha, time);

  drawGlow(ctx, w * 0.4, h * 0.5, w * 0.8, 'rgba(139,0,0,0.03)', alpha);
  drawGlow(ctx, w * 0.6 + mx * 20, h * 0.3 + my * 15, w * 0.3, 'rgba(255,215,0,0.02)', alpha);

  drawCitySilhouette(ctx, w, h, 0.35 * alpha, '#0a0a14');

  drawWindows(ctx, windows!, time, alpha);

  // Rain effect
  ctx.strokeStyle = `rgba(180,200,255,${0.06 * alpha})`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 40; i++) {
    const rx = ((i * 137 + time * 120 * (1 + (i % 3) * 0.3)) % w);
    const ry = ((i * 251 + time * 200 * (1 + (i % 2) * 0.5)) % (h * 0.8));
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 3, ry + 18);
    ctx.stroke();
  }

  drawFog(ctx, w, h, time, 0.02 * alpha, '#8B0000');

  // Ground
  ctx.globalAlpha = 0.35 * alpha;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.globalAlpha = 1;

  // Horizontal line
  ctx.strokeStyle = `rgba(139,0,0,${0.15 * alpha})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  ctx.lineTo(w, h * 0.7);
  ctx.stroke();
};
