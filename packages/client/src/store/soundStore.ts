import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { sound } from '../lib/sound';

interface SoundState {
  muted: boolean;
  masterVol: number;
  bgmVol: number;
  sfxVol: number;
  uiVol: number;
  toggleMuted: () => void;
  setMasterVol: (v: number) => void;
  setBgmVol: (v: number) => void;
  setSfxVol: (v: number) => void;
  setUiVol: (v: number) => void;
}

export const useSoundStore = create<SoundState>()(
  devtools(
    (set): SoundState => ({
      muted: false,
      masterVol: 0.7,
      bgmVol: 0.5,
      sfxVol: 0.6,
      uiVol: 0.4,
      toggleMuted: () => set((s) => {
        const next = !s.muted;
        sound.setMuted(next);
        return { muted: next };
      }),
      setMasterVol: (v) => { sound.setVolume('master', v); set({ masterVol: v }); },
      setBgmVol: (v) => { sound.setVolume('bgm', v); set({ bgmVol: v }); },
      setSfxVol: (v) => { sound.setVolume('sfx', v); set({ sfxVol: v }); },
      setUiVol: (v) => { sound.setVolume('ui', v); set({ uiVol: v }); },
    })
  )
);
