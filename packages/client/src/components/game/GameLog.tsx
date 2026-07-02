import { useRef, useEffect } from 'react';
import { GameEvent } from '@mafia/shared';
import { ScrollText } from 'lucide-react';

interface GameLogProps {
  events: GameEvent[];
}

export function GameLog({ events }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="card flex flex-col h-[300px]">
      <div className="flex items-center gap-2 p-3 border-b border-gray-800">
        <ScrollText className="w-4 h-4" />
        <span className="text-sm font-medium">Game Log</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {events.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">No events yet</p>
        )}
        {events.map((event, idx) => (
          <div key={event.id ?? idx} className="text-xs text-gray-400">
            <span className="text-gray-600">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>{' '}
            {formatEvent(event)}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

function formatEvent(event: GameEvent): string {
  switch (event.type) {
    case 'kill':
      return '💀 A player was killed';
    case 'heal':
      return '💚 A player was healed';
    case 'investigate':
      return '🔍 A player was investigated';
    case 'vote':
      return '🗳️ A vote was cast';
    case 'lynch':
      return '⚖️ A player was lynched';
    case 'reveal':
      return '📜 A role was revealed';
    case 'phase_change':
      return '🔄 Phase changed';
    default:
      return '📌 Unknown event';
  }
}
