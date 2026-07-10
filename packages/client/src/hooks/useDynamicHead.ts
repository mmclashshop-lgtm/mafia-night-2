import { useEffect } from 'react';
import { useSiteConfigStore } from '../store/siteConfigStore';

export function useDynamicHead() {
  const branding = useSiteConfigStore((s) => s.config.branding);
  const theme = useSiteConfigStore((s) => s.config.theme);

  useEffect(() => {
    const title = `${branding.name} ${branding.nameAccent}`;
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', branding.description || title);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', branding.description || title);

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', branding.description || title);

    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute('content', title);

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', theme.bgDark);

    if (branding.faviconUrl?.trim()) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;

      let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (appleLink) appleLink.href = branding.faviconUrl;
    }
  }, [branding.name, branding.nameAccent, branding.description, branding.faviconUrl, theme.bgDark]);
}
