import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/common/PageTransition';
import { getPlayerStats, type PlayerStatsData } from '../lib/api';
import { ArrowLeft, Skull, Heart, Target, Award, Calendar, Swords, Gamepad2, Trophy } from 'lucide-react';
import { TiltCard } from '../components/common/TiltCard';

export function PlayerStats() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlayerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    getPlayerStats(name)
      .then(data => { setStats(data); setError(null); })
      .catch(() => setError(t('playerStats.notFound')))
      .finally(() => setLoading(false));
  }, [name, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card-glass p-8 text-center">
        <Skull className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-red-400">{error || t('playerStats.notFound')}</p>
        <button onClick={() => navigate('/leaderboard')} className="btn-ghost mt-4 flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> {t('playerStats.backToLeaderboard')}
        </button>
      </div>
    );
  }

  const roleEntries = Object.entries(stats.roleStats);

  return (
    <PageTransition>
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {stats.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t('playerStats.playerStatistics')}</p>
        </div>
        <button onClick={() => navigate('/leaderboard')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('playerStats.back')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Award, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/30', label: t('playerStats.winRate', { wins: stats.totalWins, total: stats.totalGames }), value: `${stats.winRate}%` },
          { icon: Target, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/30', label: t('playerStats.totalKills'), value: stats.totalKills },
          { icon: Heart, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/30', label: t('playerStats.survivalRate', { survived: stats.totalSurvived, total: stats.totalGames }), value: `${stats.survivalRate}%` },
          { icon: Gamepad2, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/30', label: t('playerStats.gamesPlayed'), value: stats.totalGames },
        ].map((stat, i) => (
          <TiltCard key={i} maxTilt={8} glare={false} scale={1.02}>
            <div className={`card-hover p-4 text-center rounded-xl border ${stat.border} ${stat.bg}`}>
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </TiltCard>
        ))}
      </div>

      {roleEntries.length > 0 && (
        <div className="card-glass p-5">
          <h2 className="section-title mb-4">
            <Skull className="w-4 h-4" />
            {t('playerStats.roleStatistics')}
          </h2>
          <div className="space-y-2">
            {roleEntries.map(([role, roleStat]) => {
              const winPct = roleStat.games > 0 ? Math.round((roleStat.wins / roleStat.games) * 100) : 0;
              return (
                <div key={role} className="card-hover flex items-center justify-between p-2.5 rounded-lg">
                  <span className="text-sm capitalize font-medium">{role.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">{t('playerStats.games', { count: roleStat.games })}</span>
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${winPct >= 60 ? 'bg-green-500' : winPct >= 35 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${winPct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs">
                      <span className="text-green-400">{roleStat.wins}W</span>
                      <span className="text-gray-600 mx-0.5">/</span>
                      <span className="text-red-400">{roleStat.games - roleStat.wins}L</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.recentGames.length > 0 && (
        <div className="card-glass p-5">
          <h2 className="section-title mb-4">
            <Swords className="w-4 h-4" />
            {t('playerStats.recentGames')}
          </h2>
          <div className="space-y-1.5">
            {stats.recentGames.slice(-10).reverse().map((game, idx) => {
              const won = game.team === game.winner;
              return (
                <div key={idx} className={`card-hover flex items-center justify-between p-2.5 rounded-lg border ${
                  won ? 'border-green-900/20 bg-green-900/10' : 'border-red-900/20 bg-red-900/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${won ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm capitalize font-medium">{game.role.replace('_', ' ')}</span>
                    <span className="text-[11px] text-gray-500">({game.team})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
                      {won ? t('playerStats.won') : t('playerStats.lost')}
                    </span>
                    <span className="text-gray-500">{t('playerStats.day', { count: game.dayCount })}</span>
                    <span className="text-gray-600">{new Date(game.startedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
