import { ReactNode, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Toasts } from '../common/Toasts';
import { LoadingScreen } from '../common/LoadingScreen';
import { BackgroundSystem } from '../backgrounds/BackgroundSystem';
import { PartyBar } from '../party/PartyBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isGame = location.pathname === '/game';
  const isLobby = location.pathname === '/lobby';
  const [initialLoading, setInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      const timer = setTimeout(() => setInitialLoading(false), 600);
      return () => clearTimeout(timer);
    } else {
      setInitialLoading(false);
    }
  }, []);

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
          dir="rtl"
        >
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main
            className={
              isHome
                ? ''
                : `mx-auto px-4 py-6 pb-20 md:pb-6 w-full ${getContainerClass()}`
            }
          >
            {children}
          </main>
          <MobileNav />
          <PartyBar />
          <Toasts />
        </div>
      </BackgroundSystem>
    </>
  );
}
