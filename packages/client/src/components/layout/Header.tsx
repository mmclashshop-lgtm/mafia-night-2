import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const connected = useGameStore((s) => s.connected);
  const roomCode = useGameStore((s) => s.roomCode);

  return (
    <header className="glass-header sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button className="btn-icon md:hidden" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Mafia Night"
              className="w-7 h-7 shrink-0"
            />
            <span className="text-base font-bold tracking-tight hidden sm:inline">
              مافيا <span className="text-[#C62828]">نايت</span>
            </span>
          </Link>
          {roomCode && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 mr-3 pr-3 border-r border-[#8B0000]/10">
              <span>{t('common.room')}:</span>
              <code className="text-[#B22222] font-mono font-bold">{roomCode}</code>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            }`}
            title={connected ? t('common.connected') : t('common.disconnected')}
          />
        </div>
      </div>
    </header>
  );
}
