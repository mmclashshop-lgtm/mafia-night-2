import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/common/PageTransition';
import { SoundSettings } from '../components/common/SoundSettings';
import { useLanguage } from '../hooks/useLanguage';
import { sound } from '../lib/sound';
import { ArrowLeft, Globe, Volume2, Headphones } from 'lucide-react';

export function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();

  return (
    <PageTransition>
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="w-6 h-6 text-[#8B0000]" />
          {t('settings.title')}
        </h1>
        <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('settings.back')}
        </button>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h2 className="section-title">
          <Globe className="w-4 h-4" />
          {t('settings.language')}
        </h2>
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
        >
          <span className="text-sm text-gray-300">{t('settings.currentLanguage')}</span>
          <span className="text-sm font-semibold text-white">{language === 'en' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="card-glass p-5 space-y-4">
        <h2 className="section-title">
          <Volume2 className="w-4 h-4" />
          {t('sound.settings')}
        </h2>
        <SoundSettings />
        <button
          onClick={() => sound.click()}
          className="btn-secondary text-xs w-full flex items-center justify-center gap-2"
        >
          <Headphones className="w-3.5 h-3.5" />
          {t('settings.testSound')}
        </button>
      </div>
    </div>
    </PageTransition>
  );
}