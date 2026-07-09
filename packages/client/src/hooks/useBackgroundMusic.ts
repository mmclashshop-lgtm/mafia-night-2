import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sound } from '../lib/sound';
import { useSoundStore } from '../store/soundStore';

export function useBackgroundMusic() {
  const location = useLocation();
  const muted = useSoundStore((s) => s.muted);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (muted) {
      sound.stopPageMusic();
      return;
    }

    const path = location.pathname;

    // Don't restart if same page
    if (path === prevPathRef.current) return;
    prevPathRef.current = path;

    if (path === '/') {
      sound.startHomeMusic();
    } else if (path === '/lobby') {
      sound.startLobbyMusic();
    } else if (path === '/game') {
      // Game phase music is handled by useSound hook
    } else {
      sound.stopPageMusic();
    }
  }, [location.pathname, muted]);
}
