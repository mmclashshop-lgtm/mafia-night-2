import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sound } from '../../lib/sound';

const tipKeys: string[] = [
  'loading.tip1', 'loading.tip2', 'loading.tip3', 'loading.tip4',
  'loading.tip5', 'loading.tip6', 'loading.tip7', 'loading.tip8',
  'loading.tip9', 'loading.tip10', 'loading.tip11', 'loading.tip12',
];

interface SkullTarget {
  id: number;
  x: number;
  y: number;
}

export function LoadingScreen() {
  const { t } = useTranslation();
  const tipKey = tipKeys[Math.floor(Math.random() * tipKeys.length)]!;
  const [skulls, setSkulls] = useState<SkullTarget[]>([]);
  const [score, setScore] = useState(0);
  const [loadProgress, setLoadProgress] = useState(sound.loaded ? 1 : sound.loadingProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(sound.loadingProgress);
      if (sound.loaded) return;
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSkull: SkullTarget = {
        id: Date.now(),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      };
      setSkulls((prev) => [...prev.slice(-4), newSkull]);
      setTimeout(() => {
        setSkulls((prev) => prev.filter((s) => s.id !== newSkull.id));
      }, 800);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleCatch = (id: number) => {
    setSkulls((prev) => prev.filter((s) => s.id !== id));
    setScore((s) => s + 1);
    sound.playTone(600 + Math.random() * 400, 0.08, 'sine', 0.05);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A]">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-noise" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-[#8B0000]/10 to-transparent rounded-full blur-3xl" />

      {/* Skull minigame */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {skulls.map((skull) => (
          <button
            key={skull.id}
            onClick={() => handleCatch(skull.id)}
            className="absolute w-8 h-8 flex items-center justify-center text-lg pointer-events-auto animate-fade-in hover:scale-125 transition-transform"
            style={{ left: `${skull.x}%`, top: `${skull.y}%` }}
          >
            💀
          </button>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Score */}
        {score > 0 && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-xs text-gray-500">
            🎯 {t('loading.caught', { count: score })}
          </div>
        )}

        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#8B0000]/20 rounded-full blur-3xl scale-150" />
          <svg viewBox="0 0 120 120" width="80" height="80" className="animate-mask-float drop-shadow-[0_0_30px_rgba(139,0,0,0.5)]">
            <defs>
              <linearGradient id="lr" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B0000"/>
                <stop offset="100%" stopColor="#C62828"/>
              </linearGradient>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#DAA520"/>
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill="#0A0A0A" stroke="url(#lg)" strokeWidth="1.5"/>
            <circle cx="60" cy="60" r="48" stroke="url(#lr)" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.25"/>
            <circle cx="60" cy="60" r="38" stroke="#8B0000" strokeWidth="0.7" opacity="0.3"/>
            <line x1="22" y1="60" x2="42" y2="60" stroke="#8B0000" strokeWidth="1" opacity="0.35"/>
            <line x1="78" y1="60" x2="98" y2="60" stroke="#8B0000" strokeWidth="1" opacity="0.35"/>
            <line x1="60" y1="22" x2="60" y2="38" stroke="#8B0000" strokeWidth="1" opacity="0.35"/>
            <line x1="60" y1="82" x2="60" y2="98" stroke="#8B0000" strokeWidth="1" opacity="0.35"/>
            <path d="M36,32 Q60,26 84,32 Q60,36 36,32Z" fill="url(#lr)" opacity="0.95"/>
            <path d="M42,32 L42,18 Q42,12 60,12 Q78,12 78,18 L78,32Z" fill="url(#lr)" opacity="0.95"/>
            <rect x="42" y="26" width="36" height="3" rx="1.5" fill="url(#lg)"/>
            <path d="M52,16 Q60,20 68,16" stroke="#0A0A0A" strokeWidth="1" fill="none" opacity="0.35"/>
            <path d="M46,32 L46,40 Q46,44 50,44 L70,44 Q74,44 74,40 L74,32Z" fill="url(#lr)" opacity="0.95"/>
            <rect x="52" y="44" width="16" height="6" fill="url(#lr)" opacity="0.95"/>
            <path d="M34,50 L46,50 L46,56 Q46,60 50,60 L70,60 Q74,60 74,56 L74,50 L86,50 Q88,54 88,60 Q88,72 86,76 L82,78 Q78,76 78,74 L42,74 Q42,76 38,78 L34,76 Q32,72 32,60 Q32,54 34,50Z" fill="url(#lr)" opacity="0.95"/>
            <path d="M57,50 L60,56 L63,50 L62,68 L60,72 L58,68 Z" fill="#6B0000" opacity="0.6"/>
            <path d="M48,76 L46,98 L52,98 L54,78Z" fill="url(#lr)" opacity="0.95"/>
            <path d="M72,76 L74,98 L68,98 L66,78Z" fill="url(#lr)" opacity="0.95"/>
            <circle cx="60" cy="54" r="4" fill="url(#lg)" opacity="0.7"/>
            <circle cx="60" cy="54" r="1.5" fill="#0A0A0A"/>
          </svg>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent rounded-full animate-pulse" />
        </div>

        {/* Sound loading progress */}
        {!sound.loaded && (
          <div className="w-48 mb-4">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B0000] to-[#B22222] rounded-full transition-all duration-300"
                style={{ width: `${Math.round(loadProgress * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-1 tracking-widest">
              {t('common.loading')} {Math.round(loadProgress * 100)}%
            </p>
          </div>
        )}

        {/* Bouncing dots */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <p className="text-[#8B0000] font-semibold">{t('common.loading')}</p>

        {/* Tip */}
        <div className="max-w-md mt-10 text-center px-6 animate-fade-in-up">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{t('loading.tip')}</p>
          <p className="text-sm text-gray-500 leading-relaxed">{t(tipKey)}</p>
        </div>
      </div>
    </div>
  );
}
