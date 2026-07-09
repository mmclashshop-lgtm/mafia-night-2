import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/common/PageTransition';
import { ArrowLeft, Users, Skull, Shield, Search, Heart, Eye, Swords, FlaskRound as Flask, UserCheck, Ghost, Award, Target, Crosshair, Book, Repeat, Trophy, Star } from 'lucide-react';

const roles = [
  { id: 'villager', team: 'tutorial', icon: Users, color: 'text-green-400' },
  { id: 'mafia', team: 'tutorial', icon: Skull, color: 'text-red-400' },
  { id: 'godfather', team: 'tutorial', icon: Skull, color: 'text-red-400' },
  { id: 'doctor', team: 'tutorial', icon: Shield, color: 'text-green-400' },
  { id: 'medic', team: 'tutorial', icon: Heart, color: 'text-green-400' },
  { id: 'cop', team: 'tutorial', icon: Search, color: 'text-green-400' },
  { id: 'serial_killer', team: 'tutorial', icon: Crosshair, color: 'text-purple-400' },
  { id: 'witch', team: 'tutorial', icon: Flask, color: 'text-purple-400' },
  { id: 'vigilante', team: 'tutorial', icon: Target, color: 'text-green-400' },
  { id: 'detective', team: 'tutorial', icon: Eye, color: 'text-green-400' },
  { id: 'jester', team: 'tutorial', icon: Ghost, color: 'text-purple-400' },
  { id: 'mayor', team: 'tutorial', icon: Award, color: 'text-green-400' },
  { id: 'lovers', team: 'tutorial', icon: Heart, color: 'text-pink-400' },
  { id: 'spy', team: 'tutorial', icon: Eye, color: 'text-green-400' },
  { id: 'sniper', team: 'tutorial', icon: Crosshair, color: 'text-green-400' },
];

export function Tutorial() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageTransition>
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6 text-[#8B0000]" />
          {t('tutorial.title')}
        </h1>
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('tutorial.back')}
        </button>
      </div>

      <div className="card-glass p-5 space-y-4 card-shine">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-[#8B0000]" />
          {t('tutorial.gameOverview')}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          {t('tutorial.overviewDesc')}
        </p>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Repeat className="w-5 h-5 text-[#8B0000]" />
          {t('tutorial.gameFlow')}
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-indigo-900/40 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowNight')}</strong> {t('tutorial.flowNightDesc')}</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-amber-900/40 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowDay')}</strong> {t('tutorial.flowDayDesc')}</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowVoting')}</strong> {t('tutorial.flowVotingDesc')}</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-green-900/40 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowRepeat')}</strong> {t('tutorial.flowRepeatDesc')}</p>
          </div>
        </div>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#FFD700]" />
          {t('tutorial.winConditions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-900/10 border border-green-900/20">
            <Shield className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm text-gray-300">{t('tutorial.winTown')}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/10 border border-red-900/20">
            <Skull className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-gray-300">{t('tutorial.winMafia')}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-900/10 border border-purple-900/20">
            <Ghost className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm text-gray-300">{t('tutorial.winNeutral')}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-pink-900/10 border border-pink-900/20">
            <Heart className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="text-sm text-gray-300">{t('tutorial.winLovers')}</span>
          </div>
        </div>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-[#8B0000]" />
          {t('tutorial.allRoles')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.id} className="card-hover flex gap-3 p-3 rounded-lg">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${role.color}`} />
                <div>
                  <p className="text-sm font-medium text-white">{t(`roles.${role.id}.name`)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t(`roles.${role.id}.desc`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-[#FFD700]" />
          {t('tutorial.tips')}
        </h2>
        <ul className="text-sm text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 shrink-0" />
            {t('tutorial.tip1')}
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 shrink-0" />
            {t('tutorial.tip2')}
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 shrink-0" />
            {t('tutorial.tip3')}
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 shrink-0" />
            {t('tutorial.tip4')}
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 shrink-0" />
            {t('tutorial.tip5')}
          </li>
        </ul>
      </div>
    </div>
    </PageTransition>
  );
}
