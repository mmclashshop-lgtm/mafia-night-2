import { useRef, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { Moon, Sun, Vote, Skull, Swords } from 'lucide-react';
import type { Phase } from '@mafia/shared';

const PHASE_CONFIG: Record<string, { icon: typeof Moon; labelKey: string; color: string }> = {
  night: { icon: Moon, labelKey: 'phase.night', color: '#4B0082' },
  day: { icon: Sun, labelKey: 'phase.day', color: '#B8860B' },
  voting: { icon: Vote, labelKey: 'phase.voting', color: '#8B0000' },
  ended: { icon: Skull, labelKey: 'phase.ended', color: '#4A0000' },
  lobby: { icon: Swords, labelKey: 'phase.lobby', color: '#1a1a2e' },
};

export function PhaseTransitionOverlay({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const phase = useGameStore((s) => s.gameState?.phase);
  const prevPhaseRef = useRef<Phase | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<Phase | undefined>(undefined);

  useEffect(() => {
    if (phase && phase !== prevPhaseRef.current && prevPhaseRef.current !== undefined) {
      setCurrentTransition(phase);
      setShowOverlay(true);
      const t1 = setTimeout(() => setShowOverlay(false), 1200);
      return () => clearTimeout(t1);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const config = currentTransition ? PHASE_CONFIG[currentTransition] : null;

  return (
    <>
      {showOverlay && config && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${config.color}33 0%, ${config.color}11 40%, transparent 70%)`,
          }}
        >
          <div className="animate-fade-in-up">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `radial-gradient(circle, ${config.color}44 0%, transparent 70%)`,
                boxShadow: `0 0 60px ${config.color}44, 0 0 120px ${config.color}22`,
              }}
            >
              <config.icon className="w-12 h-12 md:w-16 md:h-16" style={{ color: config.color }} />
            </div>
            <h2
              className="text-3xl md:text-5xl font-black text-center tracking-wide"
              style={{ color: config.color, textShadow: `0 0 30px ${config.color}66` }}
            >
              {t(config.labelKey)}
            </h2>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
