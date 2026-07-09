import { useTranslation } from 'react-i18next';
import { Github, Twitter, Heart } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#8B0000]/10 bg-[#0A0A0A]/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="Mafia Night"
              className="w-7 h-7"
            />
            <span className="text-sm">
              <span className="font-bold text-gray-200">مافيا</span>{' '}
              <span className="font-bold text-[#C62828]">نايت</span>
            </span>
          </div>

          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            {t('home.footer.rights')}
          </p>

          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-[10px] flex items-center gap-1">
              {t('brand.tagline')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
