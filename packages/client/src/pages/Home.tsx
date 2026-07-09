import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { PageTransition } from '../components/common/PageTransition';
import { MatchmakingOverlay } from '../components/home/MatchmakingOverlay';
import { HomeParticles } from '../components/home/HomeParticles';
import { Zap, Swords, LogIn, Users, Shield, Key } from 'lucide-react';

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createRoom, joinRoom, joinMatchmaking, leaveMatchmaking } = useSocket();
  const setName = useAuthStore((s) => s.setName);
  const connected = useGameStore((s) => s.connected);

  const [name, setNameLocal] = useState(() => localStorage.getItem('mafia_player_name') ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => { const t = setTimeout(() => setShowContent(true), 100); return () => clearTimeout(t); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setName(name.trim());
    try {
      localStorage.setItem('mafia_player_name', name.trim());
      const code = await createRoom();
      await joinRoom(code, name.trim());
      navigate('/lobby');
    } catch { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setJoining(true);
    setName(name.trim());
    try {
      localStorage.setItem('mafia_player_name', name.trim());
      await joinRoom(roomCode.trim().toUpperCase(), name.trim());
      navigate('/lobby');
    } catch { setJoining(false); }
  };

  const handleQuickPlay = async () => {
    if (!name.trim()) return;
    setName(name.trim());
    localStorage.setItem('mafia_player_name', name.trim());
    setMatchmaking(true);
    try { await joinMatchmaking(name.trim()); }
    catch { setMatchmaking(false); }
  };

  const handleCancelMatchmaking = async () => {
    setMatchmaking(false);
    try { await leaveMatchmaking(); } catch {}
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen flex flex-col">
        {/* Particles background */}
        <HomeParticles />

        {/* Hero section */}
        <div className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-8 relative z-10 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="relative mb-6 md:mb-8">
            <div className="absolute inset-0 bg-[#8B0000]/20 rounded-full blur-[60px] scale-[2] animate-pulse-glow" />
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Mafia Night"
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 animate-mask-float drop-shadow-[0_0_40px_rgba(139,0,0,0.5)]"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-center mb-2">
            <span className="text-gray-100">مافيا</span>{' '}
            <span className="text-[#C62828]">نايت</span>
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-500 tracking-wide mb-8 md:mb-10 text-center">
            {t('brand.tagline')}
          </p>

          {/* Name input */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-6">
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setNameLocal(e.target.value)}
                maxLength={20}
                placeholder={t('home.cta.namePlaceholder')}
                className="input text-center pr-10"
                dir="rtl"
              />
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            </div>
          </div>

          {/* Quick Play — primary CTA */}
          <button
            onClick={handleQuickPlay}
            disabled={!name.trim()}
            className="btn-primary text-base px-10 py-3.5 rounded-2xl gap-2.5 mb-4 md:mb-6 animate-pulse-glow"
          >
            <Zap className="w-5 h-5" />
            {t('home.hero.cta')}
          </button>

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm md:max-w-md">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="btn-secondary flex-1 gap-2"
            >
              <Swords className="w-4 h-4" />
              {creating ? t('home.cta.creating') : t('home.cta.createRoom')}
            </button>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="btn-secondary flex-1 gap-2"
            >
              <LogIn className="w-4 h-4" />
              {t('home.cta.joinRoom')}
            </button>
          </div>

          {/* Join panel */}
          {showJoin && (
            <div className="mt-4 glass-panel p-4 w-full max-w-xs sm:max-w-sm animate-slide-up flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder={t('home.cta.roomCode')}
                  className="input text-center tracking-[0.3em] font-mono pr-10"
                  dir="rtl"
                />
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              </div>
              <button
                onClick={handleJoin}
                disabled={!name.trim() || !roomCode.trim() || joining}
                className="btn-primary w-full gap-2"
              >
                {joining ? t('home.cta.joining') : t('home.cta.joinRoom')}
              </button>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="relative z-10 pb-8">
          <div className="flex items-center justify-center gap-8 md:gap-12 text-xs md:text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
              4-12 {t('home.cta.fourToTwelve')}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {t('home.cta.classicRoles')}
            </span>
          </div>
        </div>

        {/* Matchmaking overlay */}
        {matchmaking && (
          <MatchmakingOverlay onCancel={handleCancelMatchmaking} />
        )}
      </div>
    </PageTransition>
  );
}


