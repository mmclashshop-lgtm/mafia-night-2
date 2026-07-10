import { useTranslation } from 'react-i18next';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { SiteLogo } from '../common/SiteLogo';

export function Footer() {
  const { t } = useTranslation();
  const brand = useSiteConfigStore((s) => s.config.branding);
  const theme = useSiteConfigStore((s) => s.config.theme);

  return (
    <footer className="border-t border-[#8B0000]/10 bg-[#0A0A0A]/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="w-7 h-7" />
            <span className="text-sm">
              <span className="font-bold text-gray-200">{brand.name}</span>{' '}
              <span className="font-bold" style={{ color: theme.primaryLight }}>{brand.nameAccent}</span>
            </span>
          </div>

          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            {t('home.footer.rights')}
          </p>

          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-[10px] flex items-center gap-1">
              {brand.tagline}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
