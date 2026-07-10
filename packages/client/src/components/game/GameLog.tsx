import { memo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GameEvent, Player } from '@mafia/shared';
import { ScrollText, Skull, Heart, Search, Vote, Swords, Eye, Moon } from 'lucide-react';

interface GameLogProps {
  events: GameEvent[];
  players?: Player[];
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

function getPlayerName(players: Player[] | undefined, id: string | null | undefined): string {
  if (!id || id === 'skip') return '';
  const p = players?.find(pl => pl.id === id);
  return p?.name ?? id.slice(0, 8);
}

export const GameLog = memo(function GameLog({ events, players }: GameLogProps) {
  const { t } = useTranslation();
  const logEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  return (
    <div className="card-glass flex flex-col" style={{ height: '280px' }}>
      <div className="flex items-center gap-2 p-3 border-b border-[#8B0000]/10">
        <ScrollText className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-400">{t('gameLog.title')}</span>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-2 space-y-1">
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
              <span className="text-gray-300">{formatEvent(event, t, players)}</span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  );
});

function formatEvent(event: GameEvent, t: (key: string) => string, players?: Player[]): string {
  const d = event.data as Record<string, any> | undefined;
  if (!d) return t('gameLog.unknownEvent');

  switch (event.type) {
    case 'kill': {
      const target = getPlayerName(players, d['targetId']);
      const killer = getPlayerName(players, d['killerId']);
      return killer ? `${killer} ☠ ${target}` : `☠ ${target}`;
    }
    case 'heal': {
      const healer = getPlayerName(players, d['sourceId']);
      const target = getPlayerName(players, d['targetId']);
      return target ? `${healer} 💊 ${target}` : t('gameLog.healed');
    }
    case 'investigate': {
      const source = getPlayerName(players, d['sourceId']);
      const target = getPlayerName(players, d['targetId']);
      return `${source} 🔍 ${target}`;
    }
    case 'vote': return t('gameLog.voteCast');
    case 'lynch': {
      const target = getPlayerName(players, d['targetId']);
      return target ? `⚖️ ${target} ${t('gameLog.lynched')}` : t('gameLog.lynched');
    }
    case 'reveal': return t('gameLog.roleRevealed');
    case 'phase_change': {
      const from = d['from'] as string ?? '';
      const to = d['to'] as string ?? '';
      return `${from} → ${to}`;
    }
    default: return t('gameLog.unknownEvent');
  }
}
