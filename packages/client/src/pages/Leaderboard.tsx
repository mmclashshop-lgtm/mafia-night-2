import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, getTotalStats, type LeaderboardEntry, type TotalStats } from '../lib/api';
import { Trophy, ArrowLeft, TrendingUp, Users, Activity, Medal, Crown } from 'lucide-react';

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
    { key: 'score' as const, label: 'Rank', icon: Crown },
    { key: 'winRate' as const, label: 'Win Rate', icon: TrendingUp },
    { key: 'wins' as const, label: 'Wins', icon: Trophy },
    { key: 'games' as const, label: 'Games', icon: Users },
    { key: 'kills' as const, label: 'Kills' },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h1>
          {stats && (
            <p className="text-gray-400 text-sm mt-1">
              {stats.totalGames} games played by {stats.totalPlayers} players
            </p>
          )}
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
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
          <div
            key={entry.name}
            className="card-hover p-3 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/profile/${encodeURIComponent(entry.name)}`)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              idx === 0 ? 'bg-yellow-600 text-yellow-100 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
              idx === 1 ? 'bg-gray-400 text-gray-900' :
              idx === 2 ? 'bg-amber-700 text-amber-100' :
              'bg-gray-800 text-gray-400'
            }`}>
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate flex items-center gap-2">
                {entry.name}
                <span className={RANK_COLORS[entry.rank] ?? 'text-gray-400'}>
                  {RANK_ICONS[entry.rank] ?? '🥉'}
                </span>
              </p>
              <p className="text-xs text-gray-500">{entry.rank} · {entry.score} pts</p>
            </div>

            <div className="hidden sm:block text-center min-w-[80px]">
              <p className="text-sm font-medium text-white">{entry.winRate}%</p>
              <p className="text-xs text-gray-500">
                {entry.wins}W / {entry.games - entry.wins}L
              </p>
            </div>

            <div className="text-right text-sm min-w-[80px]">
              <p className="text-gray-400">{entry.games} <span className="text-gray-600">games</span></p>
              <p className="text-xs text-gray-500">{entry.kills} kills</p>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No games played yet</p>
            <p className="text-sm mt-1">Complete a game to see stats here</p>
          </div>
        )}
      </div>
    </div>
  );
}
