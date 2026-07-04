import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { MatchmakingOverlay } from '../components/home/MatchmakingOverlay';
import {
  Play, Users, Zap, ChevronDown, Sword, Bot, Trophy, Monitor, Mic,
} from 'lucide-react';

function FeatureCard({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: string }) {
  return (
    <div className={`card-hover p-6 animate-fade-in-up ${delay}`}>
      <div className="w-10 h-10 rounded-lg bg-[#8B0000]/20 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#8B0000]" />
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export function Home() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const { createRoom, joinRoom, joinMatchmaking, leaveMatchmaking } = useSocket();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      setPlayerName(name.trim());
      const code = await createRoom();
      await joinRoom(code, name.trim());
      navigate('/lobby');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('errors.createRoom'));
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setJoining(true);
    try {
      setPlayerName(name.trim());
      await joinRoom(roomCode.toUpperCase(), name.trim());
      navigate('/lobby');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('errors.joinRoom'));
      setJoining(false);
    }
  };

  const handleQuickPlay = async () => {
    if (!name.trim()) return;
    try {
      setPlayerName(name.trim());
      await joinMatchmaking(name.trim());
      setMatchmaking(true);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('errors.matchmaking'));
    }
  };

  const handleCancelMatchmaking = () => {
    leaveMatchmaking();
    setMatchmaking(false);
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* ─── Cinematic Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#8B0000]/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#B22222]/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#8B0000]/4 to-transparent rounded-full" />
        <div className="absolute inset-0 bg-noise" />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#8B0000]/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className={`relative z-10 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#8B0000]/20 rounded-full blur-3xl scale-150" />
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="Mafia Night"
                className="w-28 h-28 md:w-36 md:h-36 animate-mask-float drop-shadow-[0_0_60px_rgba(139,0,0,0.5)]"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-3">
            <span className="text-gradient">{t('home.hero.title')}</span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
            {t('home.hero.subtitle')}
          </p>

          {/* Name input */}
          <div className="max-w-xs mx-auto mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('home.cta.namePlaceholder')}
              className="input-field text-center"
              maxLength={20}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <button
              onClick={handleQuickPlay}
              disabled={!name.trim()}
              className="btn-primary flex items-center gap-2.5 px-10 py-4 text-base relative overflow-hidden group animate-glow-pulse"
              style={{ minWidth: 200 }}
            >
              <Zap className="w-5 h-5" />
              <span className="text-base">{t('matchmaking.quickPlay')}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Play className="w-4 h-4" />
              {creating ? t('home.cta.creating') : t('home.cta.createRoom')}
            </button>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Users className="w-4 h-4" />
              {t('home.cta.joinRoom')}
            </button>
          </div>

          {/* Join room card */}
          {showJoin && (
            <div className="animate-slide-down mt-4" style={{ animationDelay: '0ms' }}>
              <div className="glass-card p-4 max-w-sm mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder={t('home.cta.roomCode')}
                    className="input-field font-mono uppercase tracking-widest text-center"
                    maxLength={6}
                    autoFocus
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!name.trim() || !roomCode.trim() || joining}
                    className="btn-primary px-5"
                  >
                    {joining ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><Sword className="w-3 h-3" /> {t('home.cta.fourToTwelve')}</span>
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {t('home.cta.classicRoles')}</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToFeatures}
          className="absolute bottom-8 text-gray-600 hover:text-white transition-colors animate-float"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {matchmaking && <MatchmakingOverlay onCancel={handleCancelMatchmaking} />}

      {/* ─── Features Section ─── */}
      <section ref={featuresRef} className="py-20 px-4" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('home.features.title')}</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, titleKey: 'home.features.multiplayer.title', descKey: 'home.features.multiplayer.desc', delay: 'animate-delay-100' },
              { icon: Sword, titleKey: 'home.features.roles.title', descKey: 'home.features.roles.desc', delay: 'animate-delay-200' },
              { icon: Mic, titleKey: 'home.features.voice.title', descKey: 'home.features.voice.desc', delay: 'animate-delay-300' },
              { icon: Bot, titleKey: 'home.features.ai.title', descKey: 'home.features.ai.desc', delay: 'animate-delay-400' },
              { icon: Trophy, titleKey: 'home.features.stats.title', descKey: 'home.features.stats.desc', delay: 'animate-delay-500' },
              { icon: Monitor, titleKey: 'home.features.crossplay.title', descKey: 'home.features.crossplay.desc', delay: 'animate-delay-700' },
            ].map(({ icon, titleKey, descKey, delay }) => (
              <FeatureCard key={titleKey} icon={icon} title={t(titleKey)} desc={t(descKey)} delay={delay} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#8B0000]/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="w-6 h-6" />
            <span className="font-semibold text-gray-400">{t('brand.name')}</span>
          </div>
          <p>&copy; {new Date().getFullYear()} {t('brand.name')}. {t('home.footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
