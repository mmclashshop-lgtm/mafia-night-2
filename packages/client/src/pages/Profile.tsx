import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Swords, Heart, Skull, Star, Zap, Gamepad2, Shield, Crown } from 'lucide-react';
import { PlayerAvatar } from '../components/common/PlayerAvatar';
import { EmptyState } from '../components/common/EmptyState';
import { getLevel, getLevelProgress } from '@mafia/shared';

const ELO_TIERS = [
  { min: 0, name: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-900/20', border: 'border-amber-700/30' },
  { min: 1200, name: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-400/30' },
  { min: 1500, name: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30' },
  { min: 1800, name: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-500/30' },
  { min: 2100, name: 'Diamond', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30' },
  { min: 2500, name: 'Mafia Lord', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/30' },
];

function getEloTier(elo: number) {
  let tier = ELO_TIERS[0]!;
  for (const t of ELO_TIERS) if (elo >= t.min) tier = t;
  return tier;
}

interface ProfileData {
  name: string; avatar?: string; totalGames: number; totalWins: number; winRate: number;
  totalKills: number; totalSurvived: number; survivalRate: number; score: number;
  rank: string; rankIcon: string; bestWinStreak: number;
  roleStats: Record<string, { games: number; wins: number }>;
  recentGames: Array<{ winner: string | null; role: string; team: string; survived: boolean; dayCount: number; startedAt: number }>;
  elo?: { casual: number; competitive: number }; xp?: number; level?: number; userId?: string;
}

export function Profile() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'games'>('stats');

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/stats/player/${encodeURIComponent(name)}`)
      .then((res) => { if (!res.ok) throw Error(); return res.json(); })
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
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
        <p className="text-gray-400">{t('playerStats.notFound')}</p>
        <button onClick={() => navigate('/leaderboard')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('playerStats.backToLeaderboard')}
        </button>
      </div>
    );
  }

  const tier = getEloTier(profile.elo?.casual ?? 1000);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Back + Header */}
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-xs">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      {/* Profile Card */}
      <div className={`card-glass p-6 text-center relative overflow-hidden ${tier.bg} ${tier.border}`}>
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-radial from-[#8B0000]/10 to-transparent rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className={`p-1 rounded-full ${tier.border} border-2`}>
              <PlayerAvatar avatar={profile.avatar ?? 'dicebear'} name={profile.name} size="xl" />
            </div>
          </div>

          {/* Name + Rank */}
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Crown className={`w-4 h-4 ${tier.color}`} />
            <span className={`text-sm font-semibold ${tier.color}`}>
              {profile.rank || tier.name}
            </span>
          </div>

          {/* Score */}
          <p className="text-sm text-gray-400 mt-1">
            {profile.score.toLocaleString()} {t('profile.pts')}
          </p>

          {/* ELO + Level */}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{profile.elo?.casual ?? 1000}</span>
              <span className="text-gray-500">ELO</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-bold">{profile.level ?? 1}</span>
              <span className="text-gray-500">{t('profile.level')}</span>
            </div>
          </div>

          {/* XP Bar */}
          {(profile.level ?? 0) > 0 && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                <span>Level {profile.level}</span>
                <span>{profile.xp ?? 0} / {getLevelProgress(profile.xp ?? 0).nextLevelXP} XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-700/50 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#8B0000] via-[#B22222] to-[#FF4444] transition-all duration-700"
                  style={{ width: `${Math.min(100, ((profile.xp ?? 0) / getLevelProgress(profile.xp ?? 0).nextLevelXP) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Win streak */}
          {profile.bestWinStreak > 1 && (
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-500">
              <Zap className="w-3 h-3" /> {t('profile.bestStreak', { count: profile.bestWinStreak })}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('profile.winRate'), value: `${profile.winRate}%`, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
          { label: t('profile.wins'), value: `${profile.totalWins}/${profile.totalGames}`, icon: Star, color: 'text-green-400', bg: 'bg-green-900/20' },
          { label: t('profile.kills'), value: profile.totalKills.toString(), icon: Swords, color: 'text-red-400', bg: 'bg-red-900/20' },
          { label: t('profile.survival'), value: `${profile.survivalRate}%`, icon: Heart, color: 'text-blue-400', bg: 'bg-blue-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="card-hover p-4 text-center">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { id: 'stats' as const, label: t('profile.statistics'), icon: Trophy },
          { id: 'games' as const, label: t('profile.recentGames'), icon: Gamepad2 },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#8B0000]/20 text-[#FF4444] border border-[#8B0000]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card-glass p-5 min-h-[250px]">
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold">{t('profile.roleStatistics')}</h3>
            {Object.entries(profile.roleStats).length === 0 ? (
              <EmptyState icon={<Swords className="w-8 h-8 text-gray-500" />} title={t('profile.noRoleData')} />
            ) : (
              <div className="space-y-2">
                {Object.entries(profile.roleStats).sort(([, a], [, b]) => b.games - a.games).map(([roleId, stats]) => {
                  const winPct = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;
                  return (
                    <div key={roleId} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white capitalize">{roleId.replace(/_/g, ' ')}</p>
                        <div className="w-full h-1.5 rounded-full bg-gray-700/50 mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#8B0000] to-[#FF4444] transition-all duration-500"
                            style={{ width: `${winPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-green-400">{stats.wins}W</p>
                        <p className="text-[10px] text-gray-500">{stats.games}G · {winPct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div>
            <h3 className="text-sm font-bold mb-3">{t('profile.recentGames')}</h3>
            {profile.recentGames.length === 0 ? (
              <EmptyState icon={<Gamepad2 className="w-8 h-8 text-gray-500" />} title={t('profile.noGamesPlayed')} />
            ) : (
              <div className="space-y-2">
                {[...profile.recentGames].reverse().slice(-10).reverse().map((game, i) => {
                  const won = game.team === game.winner;
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      won ? 'bg-green-900/10 border border-green-900/20' : 'bg-red-900/10 border border-red-900/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${won ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                        <div>
                          <p className={`text-sm font-medium capitalize ${won ? 'text-green-300' : 'text-red-300'}`}>
                            {game.role.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {t('profile.day', { count: game.dayCount })} · {new Date(game.startedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        won ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {won ? t('profile.won') : t('profile.lost')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
