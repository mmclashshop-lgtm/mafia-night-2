import { ReactNode, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Toasts } from '../common/Toasts';
import { LoadingScreen } from '../common/LoadingScreen';
import { BackgroundSystem } from '../backgrounds/BackgroundSystem';
import { PartyBar } from '../party/PartyBar';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGame = location.pathname === '/game';
  const isLobby = location.pathname === '/lobby';
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      const timer = setTimeout(() => setInitialLoading(false), 600);
      return () => clearTimeout(timer);
    } else {
      setInitialLoading(false);
    }
  }, []);

  useBackgroundMusic();

  const getContainerClass = () => {
    if (isHome) return '';
    if (isGame || isLobby) return 'max-w-7xl';
    return 'max-w-5xl';
  };

  return (
    <>
      {initialLoading && <LoadingScreen />}
      <BackgroundSystem>
        <div
          className={`min-h-screen transition-all duration-700 ${
            initialLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
          dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        >
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main
            className={
              isHome
                ? 'w-full'
                : `mx-auto px-4 py-6 pb-20 md:pb-6 w-full ${getContainerClass()}`
            }
          >
            <div className={isHome ? '' : 'flex gap-4'}>
              <div className={isHome ? '' : 'flex-1 min-w-0'}>{children}</div>
              {!isHome && !isGame && !isLobby && (
                <aside className="hidden md:block w-64 shrink-0 space-y-4">
                  <PartyBar />
                </aside>
              )}
            </div>
          </main>
          {!isHome && <Footer />}
          <MobileNav />
          <Toasts />
        </div>
      </BackgroundSystem>
    </>
  );
}
