import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Swords, Heart, Skull, Star, Zap, Gamepad2 } from 'lucide-react';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { EmptyState } from '../components/common/EmptyState';

interface ProfileData {
  name: string;
  avatar?: string;
  totalGames: number;
  totalWins: number;
  winRate: number;
  totalKills: number;
  totalSurvived: number;
  survivalRate: number;
  score: number;
  rank: string;
  rankIcon: string;
  bestWinStreak: number;
  achievements: string[];
  achievementDetails: Array<{ id: string; name: string; description: string; icon: string; category: string }>;
  roleStats: Record<string, { games: number; wins: number }>;
  recentGames: Array<{
    winner: string | null;
    role: string;
    team: string;
    survived: boolean;
    dayCount: number;
    startedAt: number;
  }>;
}

export function Profile() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'games'>('stats');

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/stats/player/${encodeURIComponent(name)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [name]);

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

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Skull className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400 text-lg">{t('playerStats.notFound')}</p>
        <button onClick={() => navigate('/leaderboard')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('playerStats.backToLeaderboard')}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'stats' as const, label: t('profile.statistics'), icon: Trophy },
    { id: 'achievements' as const, label: t('profile.achievements', { count: profile.achievements.length }), icon: Star },
    { id: 'games' as const, label: t('profile.recentGames'), icon: Gamepad2 },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <div className="card p-6 mb-4 text-center">
        <div className="flex justify-center mb-3">
          <PlayerAvatar avatar={profile.avatar ?? 'dicebear'} name={profile.name} size="lg" />
        </div>
        <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-[#8B0000] font-semibold">{profile.rank}</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-400">{profile.score.toLocaleString()} {t('profile.pts')}</span>
        </div>
        {profile.bestWinStreak > 1 && (
          <div className="flex items-center justify-center gap-1 mt-2 text-sm text-gray-500">
            <Zap className="w-3.5 h-3.5" />
            {t('profile.bestStreak', { count: profile.bestWinStreak })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: t('profile.winRate'), value: `${profile.winRate}%`, icon: Trophy, color: 'text-yellow-400' },
          { label: t('profile.wins'), value: `${profile.totalWins}/${profile.totalGames}`, icon: Star, color: 'text-green-400' },
          { label: t('profile.kills'), value: profile.totalKills, icon: Swords, color: 'text-red-400' },
          { label: t('profile.survival'), value: `${profile.survivalRate}%`, icon: Heart, color: 'text-blue-400' },
        ].map((stat) => (
          <div key={stat.label} className="card-hover p-4 text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#8B0000]/20 text-[#B22222] border border-[#8B0000]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-6 min-h-[300px]">
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white mb-3">{t('profile.roleStatistics')}</h3>
            {Object.entries(profile.roleStats).length === 0 ? (
              <EmptyState icon={<Swords className="w-8 h-8 text-gray-500" />} title={t('profile.noRoleData')} />
            ) : (
              <div className="space-y-2" style={{ contentVisibility: 'auto' }}>
                {Object.entries(profile.roleStats).sort(([, a], [, b]) => b.games - a.games).map(([roleId, stats]) => (
                  <div key={roleId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{roleId.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{t('profile.games', { count: stats.games })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">{stats.wins}W</p>
                      <p className="text-xs text-gray-500">{stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0}{t('profile.winPercent')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <h3 className="font-semibold text-white mb-3">{t('profile.achievementsTitle')}</h3>
            {profile.achievementDetails.length === 0 ? (
              <EmptyState
                icon={<Star className="w-8 h-8 text-gray-500" />}
                title={t('profile.noAchievements')}
                description={t('profile.playMore')}
              />
            ) : (
              <div className="grid gap-2">
                {profile.achievementDetails.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{achievement.name}</p>
                      <p className="text-xs text-gray-500">{achievement.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      achievement.category === 'general' ? 'bg-blue-900/30 text-blue-400' :
                      achievement.category === 'role' ? 'bg-purple-900/30 text-purple-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {achievement.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div>
            <h3 className="font-semibold text-white mb-3">{t('profile.recentGames')}</h3>
            {profile.recentGames.length === 0 ? (
              <EmptyState
                icon={<Gamepad2 className="w-8 h-8 text-gray-500" />}
                title={t('profile.noGamesPlayed')}
              />
            ) : (
              <div className="space-y-2">
                {[...profile.recentGames].reverse().slice(-10).reverse().map((game, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${game.survived ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-white capitalize">
                          {game.role.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('profile.day', { count: game.dayCount })} · {new Date(game.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      game.team === game.winner
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {game.team === game.winner ? t('profile.won') : t('profile.lost')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
