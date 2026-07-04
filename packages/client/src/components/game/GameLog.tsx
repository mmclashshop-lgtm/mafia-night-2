import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameEvent } from '@mafia/shared';
import { ScrollText, Skull, Heart, Search, Vote, Swords, Eye, Moon } from 'lucide-react';

interface GameLogProps {
  events: GameEvent[];
}

const eventIcons: Record<string, any> = {
  kill: Skull,
  heal: Heart,
  investigate: Search,
  vote: Vote,
  lynch: Swords,
  reveal: Eye,
  phase_change: Moon,
};

const eventColors: Record<string, string> = {
  kill: 'text-red-400',
  heal: 'text-green-400',
  investigate: 'text-blue-400',
  vote: 'text-yellow-400',
  lynch: 'text-orange-400',
  reveal: 'text-purple-400',
  phase_change: 'text-indigo-400',
};

export function GameLog({ events }: GameLogProps) {
  const { t } = useTranslation();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="card flex flex-col" style={{ height: '280px' }}>
      <div className="flex items-center gap-2 p-3 border-b border-[#8B0000]/10">
        <ScrollText className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-400">{t('gameLog.title')}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {events.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-6">{t('gameLog.noEvents')}</p>
        )}
        {events.map((event, idx) => {
          const Icon = eventIcons[event.type] || null;
          const color = eventColors[event.type] || 'text-gray-400';
          return (
            <div key={event.id ?? idx} className="kill-feed text-xs">
              {Icon && <Icon className={`w-3 h-3 shrink-0 ${color}`} />}
              <span className="text-gray-500 font-mono text-[10px]">
                {new Date(event.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-gray-300">{formatEvent(event, t)}</span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

function formatEvent(event: GameEvent, t: (key: string) => string): string {
  switch (event.type) {
    case 'kill': return t('gameLog.killed');
    case 'heal': return t('gameLog.healed');
    case 'investigate': return t('gameLog.investigated');
    case 'vote': return t('gameLog.voteCast');
    case 'lynch': return t('gameLog.lynched');
    case 'reveal': return t('gameLog.roleRevealed');
    case 'phase_change': return t('gameLog.phaseChanged');
    default: return t('gameLog.unknownEvent');
  }
}
