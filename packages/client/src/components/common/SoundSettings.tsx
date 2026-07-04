import { useSoundStore } from '../../store/soundStore';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Music, Speaker, Radio } from 'lucide-react';

export function SoundSettings() {
  const { t } = useTranslation();
  const {
    muted, toggleMuted,
    masterVol, bgmVol, sfxVol, uiVol,
    setMasterVol, setBgmVol, setSfxVol, setUiVol,
  } = useSoundStore();

  const sliders = [
    { label: t('sound.master'), icon: muted ? VolumeX : Volume2, value: masterVol, set: setMasterVol },
    { label: t('sound.music'), icon: Music, value: bgmVol, set: setBgmVol },
    { label: t('sound.sfx'), icon: Speaker, value: sfxVol, set: setSfxVol },
    { label: t('sound.ui'), icon: Radio, value: uiVol, set: setUiVol },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('sound.settings')}
        </span>
        <button onClick={toggleMuted} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      {sliders.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] text-gray-500 w-12">{s.label}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={s.value}
              onChange={(e) => s.set(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-[#8B0000]"
            />
            <span className="text-[10px] text-gray-600 w-6 text-right">
              {Math.round(s.value * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
