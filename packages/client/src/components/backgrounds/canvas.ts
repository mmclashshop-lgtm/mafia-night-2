export type BgRenderer = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, mx: number, my: number, alpha: number) => void;

interface Star {
  x: number; y: number; r: number; phase: number; speed: number; baseBright: number;
}

export function makeStars(count: number, w: number, h: number, yMax: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * yMax,
    r: Math.random() * 1.8 + 0.3,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 1.5 + 0.5,
    baseBright: Math.random() * 0.5 + 0.4,
  }));
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], time: number, alpha: number) {
  for (const s of stars) {
    const bright = s.baseBright + Math.sin(time * s.speed + s.phase) * 0.3;
    ctx.globalAlpha = Math.max(0.1, bright) * alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, time: number) {
  const floatY = y + Math.sin(time * 0.08) * 6;
  drawGlow(ctx, x, floatY, r * 3, 'rgba(255,232,181,0.08)', alpha);
  drawGlow(ctx, x, floatY, r * 1.8, 'rgba(255,232,181,0.12)', alpha);
  const mg = ctx.createRadialGradient(x, floatY, 0, x, floatY, r);
  mg.addColorStop(0, 'rgba(255,248,220,1)');
  mg.addColorStop(0.6, 'rgba(255,228,181,0.9)');
  mg.addColorStop(1, 'rgba(218,165,32,0.3)');
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, floatY, r * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = mg;
  ctx.fill();
  ctx.shadowColor = 'rgba(255,232,181,0.5)';
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(x, floatY, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawCitySilhouette(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, color: string) {
  ctx.globalAlpha = alpha;
  const buildings: Array<{ x: number; width: number; height: number }> = [];
  for (let x = 0; x < w; x += 60 + Math.random() * 100) {
    buildings.push({ x, width: 40 + Math.random() * 120, height: 150 + Math.random() * 300 });
  }
  ctx.fillStyle = color;
  for (const b of buildings) {
    ctx.fillRect(b.x, h - b.height, b.width, b.height);
  }
  ctx.globalAlpha = 1;
}

interface WindowLight {
  x: number; y: number; phase: number; color: string;
}

export function makeWindowLights(count: number, w: number, hMin: number, hMax: number): WindowLight[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: hMin + Math.random() * (hMax - hMin),
    phase: Math.random() * Math.PI * 2,
    color: ['#ffd700', '#ff6b6b', '#87ceeb', '#ff9f43', '#a29bfe'][Math.floor(Math.random() * 5)],
  }));
}

export function drawWindows(ctx: CanvasRenderingContext2D, windows: WindowLight[], time: number, alpha: number) {
  for (const w of windows) {
    const bright = 0.3 + Math.sin(time * 0.5 + w.phase) * 0.15 + 0.2;
    ctx.globalAlpha = bright * alpha;
    ctx.shadowColor = w.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = w.color;
    ctx.fillRect(w.x, w.y, 3, 2);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawGradient(ctx: CanvasRenderingContext2D, w: number, h: number, stops: Array<{ offset: number; color: string }>, alpha: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const s of stops) g.addColorStop(s.offset, s.color);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

export function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, alpha: number, color: string) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 300 + time * 3 * (0.3 + (i % 3) * 0.15)) % (w + 400)) - 200;
    const y = h * 0.6 + Math.sin(i * 2 + time * 0.08) * 30 + i * 35;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 250);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 250, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, alpha: number, color: string) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 4; i++) {
    const x = ((i * 400 + time * 2 * (0.2 + (i % 3) * 0.1)) % (w + 600)) - 300;
    const y = 80 + i * 60 + Math.sin(i + time * 0.05) * 12;
    for (let j = 0; j < 4; j++) {
      const cx = x + j * 70 + Math.sin(i * 2 + j) * 30;
      const cy = y + Math.cos(i + j * 0.5) * 15;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, alpha: number) {
  const x = w * 0.8;
  const y = h * 0.12;
  const pulse = 1 + Math.sin(time * 0.15) * 0.04;
  drawGlow(ctx, x, y, 400 * pulse, 'rgba(255,200,50,0.2)', alpha);
  drawGlow(ctx, x, y, 250 * pulse, 'rgba(255,200,50,0.3)', alpha);
  const sg = ctx.createRadialGradient(x, y, 0, x, y, 80 * pulse);
  sg.addColorStop(0, 'rgba(255,230,150,1)');
  sg.addColorStop(0.5, 'rgba(255,200,50,0.8)');
  sg.addColorStop(1, 'rgba(255,150,0,0)');
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, 80 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.shadowColor = 'rgba(255,200,50,0.6)';
  ctx.shadowBlur = 60;
  ctx.beginPath();
  ctx.arc(x, y, 50 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawSunRays(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, alpha: number) {
  const cx = w * 0.8;
  const cy = h * 0.12;
  ctx.globalAlpha = alpha * 0.08;
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + time * 0.02;
    const len = 200 + Math.sin(time + i) * 50;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
