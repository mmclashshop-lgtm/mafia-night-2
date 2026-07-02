import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { MatchmakingOverlay } from '../components/home/MatchmakingOverlay';
import { RoleAvatarWithFallback } from '../components/common/RoleAvatar';
import { ROLE_ICON_MAP } from '../lib/roleConfig';
import type { RoleId } from '@mafia/shared';
import {
  Sword, Users, Mic, Bot, Trophy, Monitor,
  ArrowRight, Play, ChevronDown, Sparkles, Zap
} from 'lucide-react';

function MaskLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="Mafia Night"
      className={`${className} animate-mask-float drop-shadow-[0_0_30px_rgba(139,0,0,0.3)]`}
    />
  );
}

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

function HowToPlayStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start animate-fade-in-up">
      <div className="shrink-0 w-10 h-10 rounded-full bg-[#8B0000]/20 border border-[#8B0000]/30 flex items-center justify-center">
        <span className="text-[#8B0000] font-bold">{number}</span>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function RoleIcon({ role, className = '' }: { role: string; className?: string }) {
  return (
    <RoleAvatarWithFallback
      roleId={role}
      emoji={ROLE_ICON_MAP[role] ?? '?'}
      size="sm"
      className={className}
    />
  );
}

export function Home() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const { createRoom, joinRoom, joinMatchmaking, leaveMatchmaking } = useSocket();
  const navigate = useNavigate();
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-observe]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      setPlayerName(name.trim());
      const code = await createRoom();
      await joinRoom(code, name.trim());
      navigate('/lobby');
    } catch {
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
    } catch {
      setJoining(false);
    }
  };

  const handleQuickPlay = async () => {
    if (!name.trim()) return;
    try {
      setPlayerName(name.trim());
      await joinMatchmaking(name.trim());
      setMatchmaking(true);
    } catch {
      // Failed to join queue
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
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#8B0000]/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-[#FF4444]/5 rounded-full blur-3xl" />

        <div className="relative z-10 animate-fade-in">
          <div className="flex justify-center mb-6">
            <MaskLogo className="w-24 h-24 md:w-28 md:h-28 animate-mask-float drop-shadow-[0_0_30px_rgba(139,0,0,0.3)]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            {t('home.hero.title')}{' '}
            <span className="text-gradient">{t('home.hero.titleAccent')}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              onClick={handleQuickPlay}
              disabled={!name.trim()}
              className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Zap className="w-5 h-5" />
              {t('matchmaking.quickPlay')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="btn-secondary flex items-center gap-2 px-8 py-3.5 text-base"
            >
              <Play className="w-5 h-5" />
              {creating ? t('home.cta.creating') : t('home.cta.createRoom')}
            </button>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="btn-secondary flex items-center gap-2 px-8 py-3.5 text-base"
            >
              <Users className="w-5 h-5" />
              {t('home.cta.joinRoom')}
            </button>
          </div>

          {showJoin && (
            <div className="animate-slide-down mb-8">
              <div className="card p-4 max-w-sm mx-auto space-y-3">
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
                    disabled={!name.trim() || !roomCode.trim()}
                    className="btn-primary px-5"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card p-4 max-w-sm mx-auto space-y-3">
            <div className="text-left">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">{t('home.cta.yourName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('home.cta.namePlaceholder')}
                className="input-field"
                maxLength={20}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Sword className="w-3 h-3" /> {t('home.cta.fourToTwelve')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {t('home.cta.classicRoles')}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={scrollToFeatures}
          className="absolute bottom-8 text-gray-500 hover:text-white transition-colors animate-float"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {matchmaking && <MatchmakingOverlay onCancel={handleCancelMatchmaking} />}

      {/* Features */}
      <section
        id="features"
        ref={featuresRef}
        data-observe
        className={`py-20 px-4 transition-all duration-700 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('home.features.title')}</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={Users} title={t('home.features.multiplayer.title')} desc={t('home.features.multiplayer.desc')} delay="animate-delay-100" />
            <FeatureCard icon={Sword} title={t('home.features.roles.title')} desc={t('home.features.roles.desc')} delay="animate-delay-200" />
            <FeatureCard icon={Mic} title={t('home.features.voice.title')} desc={t('home.features.voice.desc')} delay="animate-delay-300" />
            <FeatureCard icon={Bot} title={t('home.features.ai.title')} desc={t('home.features.ai.desc')} delay="animate-delay-400" />
            <FeatureCard icon={Trophy} title={t('home.features.stats.title')} desc={t('home.features.stats.desc')} delay="animate-delay-500" />
            <FeatureCard icon={Monitor} title={t('home.features.crossplay.title')} desc={t('home.features.crossplay.desc')} delay="animate-delay-700" />
          </div>
        </div>
      </section>

      {/* How to Play */}
      <section
        id="how-to-play"
        data-observe
        className={`py-20 px-4 transition-all duration-700 ${
          visibleSections.has('how-to-play') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('home.howToPlay.title')}</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto" />
          </div>

          <div className="space-y-6">
            <HowToPlayStep number="1" title={t('home.howToPlay.step1.title')} desc={t('home.howToPlay.step1.desc')} />
            <HowToPlayStep number="2" title={t('home.howToPlay.step2.title')} desc={t('home.howToPlay.step2.desc')} />
            <HowToPlayStep number="3" title={t('home.howToPlay.step3.title')} desc={t('home.howToPlay.step3.desc')} />
            <HowToPlayStep number="4" title={t('home.howToPlay.step4.title')} desc={t('home.howToPlay.step4.desc')} />
          </div>
        </div>
      </section>

      {/* Role Preview */}
      <section
        id="roles"
        data-observe
        className={`py-20 px-4 transition-all duration-700 ${
          visibleSections.has('roles') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">14 {t('home.rolesSection.title')}</h2>
            <p className="text-gray-400">{t('home.rolesSection.subtitle')}</p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              { id: 'mafia', team: 'mafia' }, { id: 'godfather', team: 'mafia' },
              { id: 'doctor', team: 'town' }, { id: 'cop', team: 'town' },
              { id: 'detective', team: 'town' }, { id: 'vigilante', team: 'town' },
              { id: 'sniper', team: 'town' }, { id: 'mayor', team: 'town' },
              { id: 'villager', team: 'town' }, { id: 'medic', team: 'town' },
              { id: 'serial_killer', team: 'neutral' }, { id: 'jester', team: 'neutral' },
              { id: 'witch', team: 'neutral' }, { id: 'spy', team: 'neutral' },
            ].map((role, i) => (
              <div
                key={role.id}
                className={`card-hover p-3 text-center animate-fade-in-up cursor-pointer group ${
                  role.team === 'mafia' ? 'hover:border-red-800/50' :
                  role.team === 'town' ? 'hover:border-blue-800/50' :
                  'hover:border-purple-800/50'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  role.team === 'mafia' ? 'bg-red-900/30 text-red-400' :
                  role.team === 'town' ? 'bg-blue-900/30 text-blue-400' :
                  'bg-purple-900/30 text-purple-400'
                }`}>
                  <RoleIcon role={role.id} />
                </div>
                <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                  {t(`roles.${role.id}.name`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta"
        data-observe
        className={`py-20 px-4 transition-all duration-700 ${
          visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-md mx-auto text-center">
          <div className="card-glow p-8">
            <Sparkles className="w-8 h-8 text-[#8B0000] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('home.cta.title')}</h2>
            <p className="text-gray-400 text-sm mb-6">{t('home.cta.subtitle')}</p>

            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('home.cta.namePlaceholder')}
                className="input-field text-center"
                maxLength={20}
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {creating ? t('home.cta.creating') : t('home.cta.createRoom')}
                </button>
                <button
                  onClick={() => setShowJoin(true)}
                  disabled={!name.trim()}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {t('home.cta.joinRoom')}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
              <a href="/leaderboard" className="text-[#B22222] hover:text-[#FF4444] transition-colors">
                {t('nav.leaderboard')} →
              </a>
              <a href="/tutorial" className="text-[#B22222] hover:text-[#FF4444] transition-colors">
                {t('nav.tutorial')} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MaskLogo className="w-6 h-6" />
            <span className="font-semibold text-gray-400">{t('brand.name')}</span>
          </div>
          <p>&copy; {new Date().getFullYear()} {t('brand.name')}. {t('home.footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
