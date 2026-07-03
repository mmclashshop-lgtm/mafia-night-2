import { ReactNode, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Toasts } from '../common/Toasts';
import { LoadingScreen } from '../common/LoadingScreen';
import { BackgroundSystem } from '../backgrounds/BackgroundSystem';
import { AuthGate } from '../auth/AuthGate';
import { PartyBar } from '../party/PartyBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [initialLoading, setInitialLoading] = useState(true);
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

  return (
    <>
      {initialLoading && <LoadingScreen />}
      <BackgroundSystem>
        <div
          className={`min-h-screen flex flex-col transition-all duration-700 ${
            initialLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
          dir="rtl"
        >
          <AuthGate>
            <Header />
            <main className={`flex-1 ${isHome ? '' : 'container mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6'}`}>
              {children}
            </main>
            <MobileNav />
            <PartyBar />
            <Toasts />
          </AuthGate>
        </div>
      </BackgroundSystem>
    </>
  );
}
