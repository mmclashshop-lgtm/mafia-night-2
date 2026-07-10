import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');

export interface ServerSiteConfig {
  branding: Record<string, string>;
  backgrounds: Record<string, string>;
  bgImages: Record<string, string>;
  bgmUrls: Record<string, string>;
  soundUrls: Record<string, string>;
  theme: Record<string, string>;
}

const DEFAULTS: ServerSiteConfig = {
  branding: { name: 'مافيا', nameAccent: 'نايت', tagline: 'خداع. استراتيجية. بقاء.', description: 'لعبة خداع اجتماعي جماعية عبر الإنترنت', logoUrl: '', faviconUrl: '' },
  backgrounds: { home: 'nightCity', lobby: 'nightCity', gameNight: 'nightSky', gameDay: 'dayTown', gameVoting: 'courtroom', gameEnded: 'theater', gameDefault: 'nightCity' },
  bgImages: { home: '', lobby: '', gameNight: '', gameDay: '', gameVoting: '', gameEnded: '', gameDefault: '' },
  bgmUrls: { 'bgm-main': '', 'bgm-lobby': '', 'bgm-night': '', 'bgm-day': '', 'bgm-voting': '', 'bgm-mafia-win': '', 'bgm-town-win': '', 'bgm-death': '' },
  soundUrls: { 'sfx-mafia-kill': '', 'sfx-timer': '', 'sfx-night-fall': '', 'sfx-day-break': '' },
  theme: { primary: '#8B0000', primaryLight: '#C62828', gold: '#FFD700', bgDark: '#0A0A0A' },
};

export function getAdminToken(): string {
  // 1. Environment variable takes priority
  const envToken = process.env['ADMIN_TOKEN'];
  if (envToken) {
    try {
      let existing = {};
      if (fs.existsSync(CONFIG_PATH)) {
        existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, adminToken: envToken }, null, 2), 'utf-8');
    } catch { /* ignore */ }
    return envToken;
  }

  // 2. Check config.json
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const saved = JSON.parse(raw);
      if (saved.adminToken) return saved.adminToken;
    }
  } catch { /* ignore */ }

  // 3. Auto-generate
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  try {
    let existing = {};
    if (fs.existsSync(CONFIG_PATH)) {
      existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, adminToken: token }, null, 2), 'utf-8');
  } catch { /* ignore */ }
  return token;
}

export function loadSiteConfig(): ServerSiteConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const saved = JSON.parse(raw);
      const result = { ...DEFAULTS };
      for (const key of Object.keys(DEFAULTS) as (keyof ServerSiteConfig)[]) {
        if (saved[key] && typeof saved[key] === 'object') {
          (result as any)[key] = { ...(DEFAULTS as any)[key], ...saved[key] };
        }
      }
      return result;
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveSiteConfig(data: Partial<ServerSiteConfig>): ServerSiteConfig {
  const current = loadSiteConfig();
  const merged: any = { ...current };
  for (const key of Object.keys(DEFAULTS) as (keyof ServerSiteConfig)[]) {
    const val = (data as any)[key];
    if (val && typeof val === 'object') {
      merged[key] = { ...(current as any)[key], ...val };
    } else if (val !== undefined) {
      merged[key] = val;
    }
  }
  try {
    let existing = {};
    if (fs.existsSync(CONFIG_PATH)) {
      existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...merged }, null, 2), 'utf-8');
  } catch { /* ignore */ }
  return merged;
}

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function saveUploadedFile(base64Data: string, fileName: string): string {
  ensureUploadDir();
  const ext = path.extname(fileName) || '.bin';
  const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, name);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${name}`;
}
