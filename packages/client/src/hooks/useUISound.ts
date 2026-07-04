import { useCallback } from 'react';
import { sound } from '../lib/sound';

export function useUISound() {
  const handleClick = useCallback(() => {
    sound.click();
  }, []);

  const handleHover = useCallback(() => {
    sound.hover();
  }, []);

  const handleNotification = useCallback(() => {
    sound.notification();
  }, []);

  const handlePageTransition = useCallback(() => {
    sound.pageTransition();
  }, []);

  return {
    click: handleClick,
    hover: handleHover,
    notify: handleNotification,
    pageTransition: handlePageTransition,
  };
}
