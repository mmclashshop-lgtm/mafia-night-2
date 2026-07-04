import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/common/PageTransition';
import { ArrowLeft, Users, Skull, Shield, Search, Heart, Eye, Swords, FlaskRound as Flask, UserCheck, Ghost, Award, Target, Crosshair } from 'lucide-react';

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
        <h1 className="text-2xl font-bold">{t('tutorial.title')}</h1>
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('tutorial.back')}
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">{t('tutorial.gameOverview')}</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          {t('tutorial.overviewDesc')}
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">{t('tutorial.gameFlow')}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowNight')}</strong> {t('tutorial.flowNightDesc')}</p>
          </div>
          <div className="flex gap-3">
            <span className="text-amber-400 font-bold shrink-0">2.</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowDay')}</strong> {t('tutorial.flowDayDesc')}</p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-400 font-bold shrink-0">3.</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowVoting')}</strong> {t('tutorial.flowVotingDesc')}</p>
          </div>
          <div className="flex gap-3">
            <span className="text-green-400 font-bold shrink-0">4.</span>
            <p className="text-gray-300"><strong className="text-white">{t('tutorial.flowRepeat')}</strong> {t('tutorial.flowRepeatDesc')}</p>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">{t('tutorial.winConditions')}</h2>
        <div className="space-y-2 text-sm">
          <p>{t('tutorial.winTown')}</p>
          <p>{t('tutorial.winMafia')}</p>
          <p>{t('tutorial.winNeutral')}</p>
          <p>{t('tutorial.winLovers')}</p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">{t('tutorial.allRoles')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.id} className="flex gap-3 p-3 rounded-lg bg-gray-800/50">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${role.color}`} />
                <div>
                  <p className="text-sm font-medium">{t(`roles.${role.id}.name`)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t(`roles.${role.id}.desc`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">{t('tutorial.tips')}</h2>
        <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
          <li>{t('tutorial.tip1')}</li>
          <li>{t('tutorial.tip2')}</li>
          <li>{t('tutorial.tip3')}</li>
          <li>{t('tutorial.tip4')}</li>
          <li>{t('tutorial.tip5')}</li>
        </ul>
      </div>
    </div>
    </PageTransition>
  );
}
