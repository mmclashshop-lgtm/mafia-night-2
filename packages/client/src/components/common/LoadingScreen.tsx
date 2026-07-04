import { useTranslation } from 'react-i18next';

const tipKeys: string[] = [
  'loading.tip1', 'loading.tip2', 'loading.tip3', 'loading.tip4',
  'loading.tip5', 'loading.tip6', 'loading.tip7', 'loading.tip8',
  'loading.tip9', 'loading.tip10', 'loading.tip11', 'loading.tip12',
];

export function LoadingScreen() {
  const { t } = useTranslation();
  const tipKey = tipKeys[Math.floor(Math.random() * tipKeys.length)]!;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A]">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-noise" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-[#8B0000]/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#8B0000]/20 rounded-full blur-3xl scale-150" />
          <svg viewBox="0 0 48 48" width="80" height="80" className="animate-mask-float drop-shadow-[0_0_30px_rgba(139,0,0,0.5)]">
            <defs>
              <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B0000"/>
                <stop offset="100%" stopColor="#B22222"/>
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="40" height="40" rx="10" fill="#0A0A0A" stroke="#8B0000" strokeWidth="1.5"/>
            <path d="M10,16 C10,16 14,10 24,10 C34,10 38,16 38,16 C38,24 40,32 38,36 C36,40 30,44 24,44 C18,44 12,40 10,36 C8,32 10,24 10,16Z" fill="url(#lg2)" opacity="0.85"/>
            <circle cx="18" cy="22" r="4" fill="#0A0A0A"/>
            <circle cx="30" cy="22" r="4" fill="#0A0A0A"/>
            <path d="M18,32 Q24,36 30,32" stroke="#0A0A0A" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent rounded-full animate-pulse" />
        </div>

        {/* Bouncing dots */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#8B0000] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <p className="text-[#8B0000] font-semibold">{t('common.loading')}</p>

        {/* Tip */}
        <div className="max-w-md mt-10 text-center px-6 animate-fade-in-up">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{t('loading.tip')}</p>
          <p className="text-sm text-gray-500 leading-relaxed">{t(tipKey)}</p>
        </div>
      </div>
    </div>
  );
}
