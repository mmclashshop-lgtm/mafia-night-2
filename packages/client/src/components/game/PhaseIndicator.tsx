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

const phaseConfig: Record<Phase, { key: string; icon: any; gradient: string; color: string }> = {
  lobby: { key: 'lobby', icon: null, gradient: 'from-gray-500 to-gray-600', color: 'text-gray-400' },
  night: { key: 'night', icon: Moon, gradient: 'from-indigo-600 to-purple-900', color: 'text-indigo-300' },
  day: { key: 'day', icon: Sun, gradient: 'from-amber-500 to-orange-600', color: 'text-yellow-300' },
  voting: { key: 'voting', icon: Vote, gradient: 'from-orange-500 to-red-600', color: 'text-orange-300' },
  ended: { key: 'gameOver', icon: Skull, gradient: 'from-red-700 to-red-900', color: 'text-red-400' },
};

export function PhaseIndicator({ phase, day, endsAt }: PhaseIndicatorProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(0);
  const config = phaseConfig[phase];
  const Icon = config.icon;

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = timeLeft <= 10 && phase !== 'lobby' && phase !== 'ended';

  return (
    <div className={`card overflow-hidden border-0 bg-gradient-to-r ${config.gradient} bg-opacity-90`}>
      <div className="p-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
          )}
          <div>
            <p className={`text-base font-bold ${config.color}`}>
              {t(`phaseIndicator.${config.key}`)}
            </p>
            {day > 0 && <p className="text-[11px] text-gray-400">{t('phaseIndicator.dayLabel', { number: day })}</p>}
          </div>
        </div>

        {phase !== 'lobby' && phase !== 'ended' && (
          <div className={`text-left transition-colors duration-300 ${isUrgent ? 'animate-countdown' : ''}`}>
            <p className={`phase-timer ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </p>
            <p className="text-[10px] text-gray-500">{t('phaseIndicator.remaining')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
