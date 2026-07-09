import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { Home, Trophy, User, GraduationCap, Globe, Users, ShoppingBag } from 'lucide-react';

export function MobileNav() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/store', icon: ShoppingBag, labelKey: 'nav.store' },
    { path: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
    { path: '/profile/me', icon: User, labelKey: 'nav.profile' },
    { path: '/friends', icon: Users, labelKey: 'nav.friends' },
    { path: '/tutorial', icon: GraduationCap, labelKey: 'nav.tutorial' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/profile/')) return location.pathname.startsWith('/profile/');
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0A0A0A]/90 backdrop-blur-2xl border-t border-[#8B0000]/10" dir="rtl">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 relative ${
              isActive(path) ? 'text-[#FF4444]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {isActive(path) && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-[#8B0000] to-[#FF4444] rounded-full" />}
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{t(labelKey)}</span>
          </button>
        ))}
        <button
          onClick={toggleLanguage}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-all duration-200"
        >
          <Globe className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{language === 'en' ? 'EN' : 'AR'}</span>
        </button>
      </div>
    </nav>
  );
}
