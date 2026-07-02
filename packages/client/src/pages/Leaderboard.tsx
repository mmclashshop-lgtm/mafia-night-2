import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLeaderboard, getTotalStats, type LeaderboardEntry, type TotalStats } from '../lib/api';
import { Trophy, ArrowLeft, TrendingUp, Users, Activity, Crown } from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { EmptyState } from '../components/common/EmptyState';

const RANK_ICONS: Record<string, string> = {
  'Bronze': '🥉',
  'Silver': '🥈',
  'Gold': '🥇',
  'Platinum': '💠',
  'Diamond': '💎',
  'Mafia Lord': '👑',
};

const RANK_COLORS: Record<string, string> = {
  'Bronze': 'text-amber-700',
  'Silver': 'text-gray-300',
  'Gold': 'text-yellow-400',
  'Platinum': 'text-cyan-400',
  'Diamond': 'text-blue-400',
  'Mafia Lord': 'text-red-400',
};

export function Leaderboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<TotalStats | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'winRate' | 'wins' | 'games' | 'kills'>('score');

  useEffect(() => {
    getLeaderboard().then(setEntries).catch(() => {});
    getTotalStats().then(setStats).catch(() => {});
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'wins') return b.wins - a.wins;
    if (sortBy === 'games') return b.games - a.games;
    if (sortBy === 'kills') return b.kills - a.kills;
    return b.winRate - a.winRate || b.games - a.games;
  });

  const sortButtons = [
    { key: 'score' as const, label: t('leaderboard.rank'), icon: Crown },
    { key: 'winRate' as const, label: t('leaderboard.winRate'), icon: TrendingUp },
    { key: 'wins' as const, label: t('leaderboard.wins'), icon: Trophy },
    { key: 'games' as const, label: t('leaderboard.games'), icon: Users },
    { key: 'kills' as const, label: t('leaderboard.kills') },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {t('leaderboard.title')}
          </h1>
          {stats && (
            <p className="text-gray-400 text-sm mt-1">
              {t('leaderboard.gamesPlayedBy', { games: stats.totalGames, players: stats.totalPlayers })}
            </p>
          )}
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('leaderboard.back')}
        </button>
      </div>

      <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
        {sortButtons.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              sortBy === key
                ? 'bg-[#8B0000] text-white shadow-[0_0_15px_rgba(139,0,0,0.3)]'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((entry, idx) => (
          <TiltCard key={entry.name} maxTilt={5} glare={false} scale={1.01}>
            <div
              className="card-hover p-3 flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/profile/${encodeURIComponent(entry.name)}`)}
            >
              <PlayerAvatar avatar={entry.avatar ?? 'dicebear'} name={entry.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate flex items-center gap-2">
                  {entry.name}
                  <span className={RANK_COLORS[entry.rank] ?? 'text-gray-400'}>
                    {RANK_ICONS[entry.rank] ?? '🥉'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">{entry.rank} · {entry.score} {t('leaderboard.pts')}</p>
              </div>

              <div className="hidden sm:block text-center min-w-[80px]">
                <p className="text-sm font-medium text-white">{entry.winRate}%</p>
                <p className="text-xs text-gray-500">
                  {entry.wins}W / {entry.games - entry.wins}L
                </p>
              </div>

              <div className="text-right text-sm min-w-[80px]">
                <p className="text-gray-400">{entry.games} <span className="text-gray-600">{t('leaderboard.gamesLabel')}</span></p>
                <p className="text-xs text-gray-500">{entry.kills} {t('leaderboard.killsLabel')}</p>
              </div>
            </div>
          </TiltCard>
        ))}
        {sorted.length === 0 && (
          <EmptyState
            icon={<Activity className="w-8 h-8 text-gray-500" />}
            title={t('leaderboard.noGamesPlayed')}
            description={t('leaderboard.noStatsDesc')}
          />
        )}
      </div>
    </div>
  );
}
