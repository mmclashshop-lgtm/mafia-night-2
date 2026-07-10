import { useState, useEffect } from 'react';
import { useSiteConfigStore } from '../../store/siteConfigStore';

interface SiteLogoProps {
  className?: string;
  showText?: boolean;
  textClass?: string;
  accentClass?: string;
  alt?: string;
}

export function SiteLogo({ className = 'w-7 h-7', showText = false, textClass = '', accentClass = '', alt = '' }: SiteLogoProps) {
  const logoUrl = useSiteConfigStore((s) => s.config.branding.logoUrl);
  const brandName = useSiteConfigStore((s) => s.config.branding.name);
  const brandAccent = useSiteConfigStore((s) => s.config.branding.nameAccent);
  const themeLight = useSiteConfigStore((s) => s.config.theme.primaryLight);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const customLogo = logoUrl?.trim() || '';
  const useCustom = !!customLogo && !imgError;

  useEffect(() => {
    if (!customLogo) { setImgError(false); setImgLoaded(false); return; }
    setImgError(false);
    setImgLoaded(false);
    const img = new Image();
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgError(true);
    img.src = customLogo;
  }, [customLogo]);

  return (
    <>
      {useCustom && imgLoaded ? (
        <img src={customLogo} alt={alt} className={className} />
      ) : useCustom ? null : (
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt={alt} className={className} />
      )}
      {showText && (
        <span className={textClass}>
          {brandName} <span className={accentClass} style={{ color: themeLight }}>{brandAccent}</span>
        </span>
      )}
    </>
  );
}
