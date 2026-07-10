import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchSiteConfig, saveSiteConfig as apiSaveSiteConfig } from '../lib/api';

export type BgKey = 'nightCity' | 'nightSky' | 'dayTown' | 'courtroom' | 'theater' | 'solid-black' | 'solid-dark' | 'solid-red';

export interface SiteConfig {
  branding: {
    name: string;
    nameAccent: string;
    tagline: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
  };
  backgrounds: Record<string, string>;
  bgImages: Record<string, string>;
  bgmUrls: Record<string, string>;
  soundUrls: {
    'sfx-mafia-kill': string;
    'sfx-timer': string;
    'sfx-night-fall': string;
    'sfx-day-break': string;
  };
  theme: {
    primary: string;
    primaryLight: string;
    gold: string;
    bgDark: string;
  };
}

const DEFAULTS: SiteConfig = {
  branding: { name: 'مافيا', nameAccent: 'نايت', tagline: 'خداع. استراتيجية. بقاء.', description: 'لعبة خداع اجتماعي جماعية عبر الإنترنت', logoUrl: '', faviconUrl: '' },
  backgrounds: { home: 'nightCity', lobby: 'nightCity', gameNight: 'nightSky', gameDay: 'dayTown', gameVoting: 'courtroom', gameEnded: 'theater', gameDefault: 'nightCity' },
  bgImages: { home: '', lobby: '', gameNight: '', gameDay: '', gameVoting: '', gameEnded: '', gameDefault: '' },
  bgmUrls: { 'bgm-main': '', 'bgm-lobby': '', 'bgm-night': '', 'bgm-day': '', 'bgm-voting': '', 'bgm-mafia-win': '', 'bgm-town-win': '', 'bgm-death': '' },
  soundUrls: { 'sfx-mafia-kill': '', 'sfx-timer': '', 'sfx-night-fall': '', 'sfx-day-break': '' },
  theme: { primary: '#8B0000', primaryLight: '#C62828', gold: '#FFD700', bgDark: '#0A0A0A' },
};

function deepMerge(saved: Record<string, any> | null | undefined, defaults: SiteConfig): SiteConfig {
  if (!saved || typeof saved !== 'object') return { ...defaults };
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof SiteConfig)[]) {
    const savedVal = saved[key];
    const defaultVal = (defaults as any)[key];
    if (savedVal && typeof savedVal === 'object' && typeof defaultVal === 'object' && !Array.isArray(savedVal)) {
      (result as any)[key] = { ...defaultVal, ...savedVal };
    } else if (savedVal !== undefined) {
      (result as any)[key] = savedVal;
    }
  }
  return result;
}

interface SiteConfigStore {
  config: SiteConfig;
  loaded: boolean;
  updateBranding: (branding: Partial<SiteConfig['branding']>) => void;
  updateBackground: (key: string, value: string) => void;
  updateBgImage: (key: string, value: string) => void;
  updateBgmUrl: (key: string, value: string) => void;
  updateSoundUrl: (key: keyof SiteConfig['soundUrls'], value: string) => void;
  updateTheme: (theme: Partial<SiteConfig['theme']>) => void;
  resetToDefaults: () => void;
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

export const useSiteConfigStore = create<SiteConfigStore>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULTS },
      loaded: false,

      updateBranding: (branding) =>
        set((s) => ({ config: { ...s.config, branding: { ...s.config.branding, ...branding } } })),
      updateBackground: (key, value) =>
        set((s) => ({ config: { ...s.config, backgrounds: { ...s.config.backgrounds, [key]: value } } })),
      updateBgImage: (key, value) =>
        set((s) => ({ config: { ...s.config, bgImages: { ...s.config.bgImages, [key]: value } } })),
      updateBgmUrl: (key, value) =>
        set((s) => ({ config: { ...s.config, bgmUrls: { ...s.config.bgmUrls, [key]: value } } })),
      updateSoundUrl: (key, value) =>
        set((s) => ({ config: { ...s.config, soundUrls: { ...s.config.soundUrls, [key]: value } } })),
      updateTheme: (theme) =>
        set((s) => ({ config: { ...s.config, theme: { ...s.config.theme, ...theme } } })),
      resetToDefaults: () => set({ config: { ...DEFAULTS } }),

      saveToServer: async () => {
        try {
          const { config } = get();
          await apiSaveSiteConfig(config);
        } catch { /* silent */ }
      },

      loadFromServer: async () => {
        try {
          const serverConfig = await fetchSiteConfig();
          if (serverConfig && typeof serverConfig === 'object') {
            set({ config: deepMerge(serverConfig, DEFAULTS), loaded: true });
          }
        } catch {
          set({ loaded: true });
        }
      },
    }),
    {
      name: 'mafia-site-config',
      merge: (persisted, current) => ({
        ...current,
        config: deepMerge((persisted as any)?.config, DEFAULTS),
      }),
    }
  )
);
