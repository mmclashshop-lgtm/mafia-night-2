import { ReactNode, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Toasts } from '../common/Toasts';
import { LoadingScreen } from '../common/LoadingScreen';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      const timer = setTimeout(() => setInitialLoading(false), 600);
      return () => clearTimeout(timer);
    } else {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    const dir = i18n.language?.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  return (
    <>
      {initialLoading && <LoadingScreen />}
      <div
        className={`min-h-screen flex flex-col transition-opacity duration-500 ${
          initialLoading ? 'opacity-0' : 'opacity-100'
        }`}
        dir={i18n.language?.startsWith('ar') ? 'rtl' : 'ltr'}
      >
        <Header />
        <main className={`flex-1 ${isHome ? '' : 'container mx-auto max-w-5xl px-4 py-6'}`}>
          {children}
        </main>
        <Toasts />
      </div>
    </>
  );
}
