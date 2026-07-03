import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { UserMenu } from './UserMenu';
import { Trophy, Globe } from 'lucide-react';

function MaskIcon() {
  return (
    <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Mafia Night" className="w-7 h-7 shrink-0" />
  );
}

export function Header() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const connected = useGameStore((s) => s.connected);
  const roomCode = useGameStore((s) => s.roomCode);
  const { isAuthenticated } = useAuth();

  return (
    <header className="glass sticky top-0 z-50">
      <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <MaskIcon />
            <span className="text-[#F5F5F5]">{t('brand.name')}</span>
          </Link>
          <Link to="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            {t('nav.leaderboard')}
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated && <UserMenu />}

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            title={t('nav.language')}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="font-medium">{language === 'en' ? 'EN' : 'AR'}</span>
          </button>

          {roomCode && (
            <span className="text-gray-400">
              {t('common.room')}: <code className="text-[#B22222] font-mono">{roomCode}</code>
            </span>
          )}

          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30'
            }`}
            title={connected ? t('common.connected') : t('common.disconnected')}
          />
        </div>
      </div>
    </header>
  );
}
