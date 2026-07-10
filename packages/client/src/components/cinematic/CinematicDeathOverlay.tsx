import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skull } from 'lucide-react';

interface CinematicDeathOverlayProps {
  onComplete: () => void;
}

export function CinematicDeathOverlay({ onComplete }: CinematicDeathOverlayProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'enter' | 'sustain' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('sustain'), 500);
    const t2 = setTimeout(() => setPhase('exit'), 2500);
    const t3 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div
        className={`absolute inset-0 bg-gradient-to-b from-[#8B0000] via-[#4A0000] to-black transition-all duration-700 ${
          phase === 'enter' ? 'opacity-0' : phase === 'sustain' ? 'opacity-70' : 'opacity-0'
        }`}
      />

      <div
        className={`relative transition-all duration-1000 ${
          phase === 'enter' ? 'opacity-0 scale-50' : phase === 'sustain' ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
        }`}
      >
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-red-600/20 animate-ping" />
          </div>
          <Skull className="w-20 h-20 text-red-500 animate-float" />
        </div>
        <p className="text-2xl font-bold text-red-400 text-center mt-4 animate-pulse">
          {t('cinematicDeathOverlay.youAreDead')}
        </p>
      </div>

      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-red-500 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `rippleAnim ${0.5 + Math.random() * 1}s ease-out ${Math.random() * 0.5}s forwards`,
            opacity: phase === 'sustain' ? 0.8 : 0,
          }}
        />
      ))}
    </div>
  );
}
