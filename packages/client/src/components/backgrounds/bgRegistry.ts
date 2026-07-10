import type { BgRenderer } from './canvas';
import { renderNightCity } from './nightCity';
import { renderNightSky } from './nightSky';
import { renderDayTown } from './dayTown';
import { renderCourtroom } from './courtroom';
import { renderTheater } from './theater';
import type { BgKey } from '../../store/siteConfigStore';

const SOLID_BG_RECORD: Record<string, string> = {
  'solid-black': '#000000',
  'solid-dark': '#0A0A0A',
  'solid-red': '#1A0000',
};

function makeSolidRenderer(color: string): BgRenderer {
  return (ctx, w, h, _time, _mx, _my, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  };
}

const RENDERERS: Record<string, BgRenderer> = {
  nightCity: renderNightCity,
  nightSky: renderNightSky,
  dayTown: renderDayTown,
  courtroom: renderCourtroom,
  theater: renderTheater,
};

for (const [key, color] of Object.entries(SOLID_BG_RECORD)) {
  RENDERERS[key] = makeSolidRenderer(color);
}

export function getBgRenderer(key: BgKey): BgRenderer {
  return RENDERERS[key] ?? renderNightCity;
}

export const BG_OPTIONS: { key: BgKey; label: string }[] = [
  { key: 'nightCity', label: 'Night City' },
  { key: 'nightSky', label: 'Night Sky' },
  { key: 'dayTown', label: 'Day Town' },
  { key: 'courtroom', label: 'Courtroom' },
  { key: 'theater', label: 'Theater' },
  { key: 'solid-black', label: 'Solid Black' },
  { key: 'solid-dark', label: 'Solid Dark' },
  { key: 'solid-red', label: 'Solid Red' },
];
