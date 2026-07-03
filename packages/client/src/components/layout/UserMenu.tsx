import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { LogOut, User, ChevronDown, Trophy, Star } from 'lucide-react';

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, name, avatar, profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!userId || !name) return null;

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
      >
        <PlayerAvatar avatar={avatar ?? 'dicebear'} name={name} size="sm" />
        <span className="text-sm font-medium text-white hidden sm:inline">{name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-gray-900 shadow-2xl py-2 z-50">
          <div className="px-3 py-2 border-b border-white/5 mb-1">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-gray-500">{t('nav.profile')}</p>
          </div>

          <button
            onClick={() => { navigate('/friends'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <User className="w-4 h-4" />
            {t('nav.friends')}
          </button>

          <button
            onClick={() => { navigate('/leaderboard'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Trophy className="w-4 h-4" />
            {t('nav.leaderboard')}
          </button>

          {profile && (
            <>
              <div className="px-3 py-2 border-t border-white/5 mt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    {t('profile.elo')}
                  </span>
                  <span className="text-yellow-400 font-medium">{profile.elo.casual}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Star className="w-3 h-3 text-blue-400" />
                    {t('profile.level')}
                  </span>
                  <span className="text-blue-400 font-medium">{profile.level}</span>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/5 mt-1"
          >
            <LogOut className="w-4 h-4" />
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
