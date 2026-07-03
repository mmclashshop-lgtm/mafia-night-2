import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../hooks/useLanguage';
import { Home, Trophy, User, GraduationCap, Globe, Users } from 'lucide-react';

export function MobileNav() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const connected = useGameStore((s) => s.connected);
  const { name } = useAuthStore();

  const NAV_ITEMS = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
    { path: name ? `/profile/${encodeURIComponent(name)}` : '/', icon: User, labelKey: 'nav.profile' },
    { path: '/friends', icon: Users, labelKey: 'nav.friends' },
    { path: '/tutorial', icon: GraduationCap, labelKey: 'nav.tutorial' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/profile/')) return location.pathname.startsWith('/profile/');
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" dir="rtl">
      <div className="glass border-t border-gray-800/50">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative ${
                isActive(path)
                  ? 'text-[#B22222]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {isActive(path) && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#B22222] rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </button>
          ))}
          <button
            onClick={toggleLanguage}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-all duration-200"
          >
            <div className="relative">
              <Globe className="w-5 h-5" />
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <span className="text-[10px] font-medium">{language === 'en' ? 'EN' : 'AR'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
