import { useEffect } from 'react';
import { sound } from '../lib/sound';

export function useGlobalSound() {
  useEffect(() => {
    let hoverTimer: ReturnType<typeof setTimeout>;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button, [role="button"], a[href]');
      if (!btn) return;
      if (btn.closest('[data-no-sound]') !== null) return;
      if (btn.getAttribute('data-no-sound') !== null) return;
      sound.click();
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button, [role="button"], a[href]');
      if (!btn) return;
      if (btn.closest('[data-no-sound]') !== null) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => sound.hover(), 60);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('mouseover', handleHover, { passive: true });
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseover', handleHover);
      clearTimeout(hoverTimer);
    };
  }, []);
}
