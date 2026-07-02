import { useEffect, useState } from 'react';
import { Phase } from '@mafia/shared';
import { formatTime } from '../../lib/utils';

interface PhaseIndicatorProps {
  phase: Phase;
  day: number;
  endsAt: number;
}

const phaseConfig: Record<Phase, { label: string; color: string; icon: string }> = {
  lobby: { label: 'Lobby', color: 'text-gray-400', icon: '⏳' },
  night: { label: 'Night', color: 'text-indigo-400', icon: '🌙' },
  day: { label: 'Day', color: 'text-yellow-400', icon: '☀️' },
  voting: { label: 'Voting', color: 'text-orange-400', icon: '🗳️' },
  ended: { label: 'Game Over', color: 'text-red-400', icon: '🏁' },
};

export function PhaseIndicator({ phase, day, endsAt }: PhaseIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const config = phaseConfig[phase];

  return (
    <div className="card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <p className={`text-lg font-bold ${config.color}`}>{config.label}</p>
          {day > 0 && <p className="text-xs text-gray-500">Day {day}</p>}
        </div>
      </div>

      {phase !== 'lobby' && phase !== 'ended' && (
        <div className="text-right">
          <p className="text-2xl font-mono font-bold tabular-nums">
            {formatTime(timeLeft)}
          </p>
          <p className="text-xs text-gray-500">remaining</p>
        </div>
      )}
    </div>
  );
}
