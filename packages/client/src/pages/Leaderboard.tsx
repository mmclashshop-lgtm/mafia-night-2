import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLeaderboard, getTotalStats, type LeaderboardEntry, type TotalStats } from '../lib/api';
import { PageTransition, FadeIn } from '../components/common/PageTransition';
import { Trophy, ArrowLeft, TrendingUp, Users, Activity, Crown, Shield, Star, Swords, Search } from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { EmptyState } from '../components/common/EmptyState';

const RANK_ICONS: Record<string, string> = {
  'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Platinum': '💠', 'Diamond': '💎', 'Mafia Lord': '👑',
};

const RANK_COLORS: Record<string, string> = {
  'Bronze': 'text-amber-700', 'Silver': 'text-gray-300', 'Gold': 'text-yellow-400',
  'Platinum': 'text-cyan-400', 'Diamond': 'text-blue-400', 'Mafia Lord': 'text-red-400',
};

type SortKey = 'score' | 'winRate' | 'wins' | 'games' | 'kills' | 'elo' | 'level';

export function Leaderboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<TotalStats | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('score');

  useEffect(() => {
    getLeaderboard().then(setEntries).catch(() => {});
    getTotalStats().then(setStats).catch(() => {});
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'wins') return b.wins - a.wins;
    if (sortBy === 'games') return b.games - a.games;
    if (sortBy === 'kills') return b.kills - a.kills;
    if (sortBy === 'elo') return (b.elo ?? 1000) - (a.elo ?? 1000);
    if (sortBy === 'level') return (b.level ?? 1) - (a.level ?? 1);
    return b.winRate - a.winRate || b.games - a.games;
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const sortButtons = [
    { key: 'score' as SortKey, label: t('leaderboard.rank'), icon: Crown },
    { key: 'elo' as SortKey, label: 'ELO', icon: Shield },
    { key: 'winRate' as SortKey, label: t('leaderboard.winRate'), icon: TrendingUp },
    { key: 'wins' as SortKey, label: t('leaderboard.wins'), icon: Trophy },
    { key: 'level' as SortKey, label: t('leaderboard.level'), icon: Star },
    { key: 'games' as SortKey, label: t('leaderboard.games'), icon: Users },
    { key: 'kills' as SortKey, label: t('leaderboard.kills'), icon: Swords },
  ];

  return (
    <PageTransition>
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {t('leaderboard.title')}
          </h1>
          {stats && (
            <p className="text-gray-400 text-xs mt-0.5">
              {t('leaderboard.gamesPlayedBy', { games: stats.totalGames, players: stats.totalPlayers })}
            </p>
          )}
        </div>
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-2 text-xs px-3 py-2">
          <ArrowLeft className="w-4 h-4" /> {t('leaderboard.back')}
        </button>
      </div>

      {/* Sort buttons */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {sortButtons.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSortBy(key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              sortBy === key
                ? 'btn-primary text-xs px-3 py-1.5'
                : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222] hover:text-white border border-transparent'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {top3.length === 3 && sortBy === 'score' && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[1, 0, 2].map((idx) => {
            const entry = top3[idx]!;
            const heights = ['justify-end', 'h-32 justify-end', 'h-24 justify-end'];
            const medals = ['🥈', '🥇', '🥉'];
            const podiumBorders = [
              'border-gray-500/30 bg-gray-800/40',
              'border-yellow-500/30 bg-yellow-900/10',
              'border-amber-700/30 bg-amber-900/10',
            ];
            const medalClasses = ['text-2xl', 'text-3xl', 'text-2xl'];
            return (
              <div key={entry.name} className={`flex flex-col items-center gap-2 cursor-pointer ${heights[idx]}`}
                onClick={() => navigate(`/profile/${encodeURIComponent(entry.name)}`)}>
                <span className={medalClasses[idx]}>{medals[idx]}</span>
                <div className={`w-full rounded-xl p-3 text-center border ${podiumBorders[idx]} backdrop-blur-sm`}>
                  <div className="flex justify-center mb-1">
                    <PlayerAvatar avatar={entry.avatar ?? 'dicebear'} name={entry.name} size="sm" />
                  </div>
                  <p className="text-xs font-semibold truncate text-white">{entry.name}</p>
                  <p className="text-[10px] text-gray-400">{entry.score.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of entries */}
      <div className="space-y-1.5">
        {sorted.map((entry, idx) => (
          <TiltCard key={entry.name} maxTilt={3} glare={false} scale={1.005}>
            <div className="card-hover p-3 flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/profile/${encodeURIComponent(entry.name)}`)}>
              {/* Rank number */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                idx === 0 ? 'rank-badge-1' : idx === 1 ? 'rank-badge-2' : idx === 2 ? 'rank-badge-3' : 'text-gray-600 bg-gray-800'
              }`}>
                {idx + 1}
              </div>

              <PlayerAvatar avatar={entry.avatar ?? 'dicebear'} name={entry.name} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{entry.name}</p>
                <p className="text-[10px] text-gray-500">
                  <span className={RANK_COLORS[entry.rank] ?? 'text-gray-400'}>
                    {RANK_ICONS[entry.rank] ?? '🥉'} {entry.rank}
                  </span>
                  <span className="mx-1">·</span>
                  {entry.score.toLocaleString()} pts
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-center">
                {sortBy === 'elo' && (
                  <div className="min-w-[60px]">
                    <p className="text-sm font-bold text-yellow-400">{entry.elo ?? 1000}</p>
                    <p className="text-[10px] text-gray-500">ELO</p>
                  </div>
                )}
                {sortBy === 'level' && (
                  <div className="min-w-[50px]">
                    <p className="text-sm font-bold text-blue-400">{entry.level ?? 1}</p>
                    <p className="text-[10px] text-gray-500">Lv</p>
                  </div>
                )}
                <div className="min-w-[70px]">
                  <p className="text-sm font-bold text-white">{entry.winRate}%</p>
                  <p className="text-[10px] text-gray-500">{entry.wins}W / {entry.games - entry.wins}L</p>
                </div>
              </div>

              <div className="text-right text-xs min-w-[60px]">
                <p className="text-gray-400">{entry.games} <span className="text-gray-600">G</span></p>
                <p className="text-[10px] text-gray-500">{entry.kills} K</p>
              </div>
            </div>
          </TiltCard>
        ))}
        {sorted.length === 0 && (
          <EmptyState icon={<Activity className="w-8 h-8 text-gray-500" />} title={t('leaderboard.noGamesPlayed')} description={t('leaderboard.noStatsDesc')} />
        )}
      </div>
    </div>
    </PageTransition>
  );
}
