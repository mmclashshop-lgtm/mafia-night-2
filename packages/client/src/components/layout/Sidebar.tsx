import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { useGameStore } from '../../store/gameStore';
import {
  Home, Trophy, User, GraduationCap, Users, ShoppingBag, Globe, Volume2, X,
} from 'lucide-react';
import { SoundSettings } from '../common/SoundSettings';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = useGameStore((s) => s.roomCode);

  const NAV_ITEMS = [
    { path: '/', icon: Home, labelKey: 'nav.home' },
    { path: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
    { path: '/store', icon: ShoppingBag, labelKey: 'nav.store' },
    { path: '/profile/me', icon: User, labelKey: 'nav.profile' },
    { path: '/friends', icon: Users, labelKey: 'nav.friends' },
    { path: '/tutorial', icon: GraduationCap, labelKey: 'nav.tutorial' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/profile/')) return location.pathname.startsWith('/profile/');
    return location.pathname.startsWith(path);
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed top-0 right-0 z-50 h-full w-64 bg-[#0A0A0A]/90 backdrop-blur-2xl border-l border-[#8B0000]/10 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-[#8B0000]/10">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="w-8 h-8" />
            <div>
              <span className="font-bold text-sm block">مافيا <span className="text-[#C62828]">نايت</span></span>
              {roomCode && <code className="text-[10px] font-mono text-[#B22222]">{roomCode}</code>}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive(path)
                  ? 'text-white bg-[#8B0000]/15 border border-[#8B0000]/20 shadow-[0_0_15px_rgba(139,0,0,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {isActive(path) && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#B22222] rounded-full" />}
              <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive(path) ? 'text-[#FF4444]' : 'group-hover:text-[#FF4444]'}`} />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#8B0000]/10 space-y-1">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
          >
            <Globe className="w-4.5 h-4.5 shrink-0" />
            <span>{language === 'en' ? 'English' : 'العربية'}</span>
          </button>
          <details className="group">
            <summary className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200 cursor-pointer list-none">
              <Volume2 className="w-4.5 h-4.5 shrink-0" />
              <span>{t('sound.settings')}</span>
            </summary>
            <div className="px-4 py-2"><SoundSettings /></div>
          </details>
        </div>
      </aside>
    </>
  );
}
