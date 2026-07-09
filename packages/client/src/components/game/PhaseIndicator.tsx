import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phase } from '@mafia/shared';
import { formatTime } from '../../lib/utils';
import { Moon, Sun, Vote, Skull } from 'lucide-react';

interface PhaseIndicatorProps {
  phase: Phase;
  day: number;
  endsAt: number;
}

const phaseConfig: Record<Phase, { key: string; icon: any; glow: string; color: string }> = {
  lobby: { key: 'lobby', icon: null, glow: 'from-gray-500/20 via-gray-500/5 to-transparent', color: 'text-gray-400' },
  night: { key: 'night', icon: Moon, glow: 'from-indigo-600/30 via-purple-800/10 to-transparent', color: 'text-indigo-300' },
  day: { key: 'day', icon: Sun, glow: 'from-amber-500/30 via-orange-600/10 to-transparent', color: 'text-yellow-300' },
  voting: { key: 'voting', icon: Vote, glow: 'from-orange-500/30 via-red-600/10 to-transparent', color: 'text-orange-300' },
  ended: { key: 'gameOver', icon: Skull, glow: 'from-red-700/30 via-red-900/10 to-transparent', color: 'text-red-400' },
};

export function PhaseIndicator({ phase, day, endsAt }: PhaseIndicatorProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(0);
  const config = phaseConfig[phase];
  const Icon = config.icon;

  useEffect(() => {
    const update = () => { setTimeLeft(Math.max(0, Math.floor((endsAt - Date.now()) / 1000))); };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = timeLeft <= 10 && phase !== 'lobby' && phase !== 'ended';

  return (
    <div className="card premium relative overflow-visible">
      <div className={`absolute inset-0 bg-gradient-to-r ${config.glow} rounded-[inherit] pointer-events-none`} />
      <div className="relative p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
          )}
          <div>
            <p className={`text-base font-bold ${config.color}`}>{t(`phaseIndicator.${config.key}`)}</p>
            {day > 0 && <p className="text-[11px] text-gray-400">{t('phaseIndicator.dayLabel', { number: day })}</p>}
          </div>
        </div>

        {phase !== 'lobby' && phase !== 'ended' && (
          <div className={`text-left transition-colors duration-300 ${isUrgent ? 'animate-countdown' : ''}`}>
            <p className={`phase-timer ${isUrgent ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</p>
            <p className="text-[10px] text-gray-500">{t('phaseIndicator.remaining')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
