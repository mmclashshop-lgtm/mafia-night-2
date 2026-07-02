import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();

  const language = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  const setLanguage = (lang: 'en' | 'ar') => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return { language, toggleLanguage, setLanguage };
}
