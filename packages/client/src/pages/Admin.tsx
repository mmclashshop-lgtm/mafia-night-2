import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/common/PageTransition';
import { useSiteConfigStore, type BgKey } from '../store/siteConfigStore';
import { useUIStore } from '../store/uiStore';
import { BG_OPTIONS } from '../components/backgrounds/bgRegistry';
import { FileUpload } from '../components/common/FileUpload';
import { SiteLogo } from '../components/common/SiteLogo';
import { ArrowLeft, Save, RotateCcw, Palette, Music, Image, Type, Volume2, Bell, Eye, Loader2 } from 'lucide-react';

export function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useSiteConfigStore();
  const addToast = useUIStore((s) => s.addToast);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [previewTab, setPreviewTab] = useState<'logo' | 'hero'>('logo');
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(statusTimer.current);
  }, []);

  const showStatus = (s: 'saved' | 'error') => {
    setStatus(s);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus('idle'), 2000);
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      await store.saveToServer();
      addToast('success', 'تم حفظ الإعدادات');
      showStatus('saved');
    } catch {
      addToast('error', 'فشل الحفظ');
      showStatus('error');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('مسح كل الإعدادات وإرجاعها للافتراضي؟')) return;
    store.resetToDefaults();
    setStatus('saving');
    try {
      await store.saveToServer();
      addToast('success', 'تم reset الإعدادات');
      showStatus('saved');
    } catch {
      addToast('error', 'فشل reset الإعدادات');
      showStatus('error');
    }
  };

  const bg = store.config.bgImages['home']?.trim() ? { backgroundImage: `url(${store.config.bgImages['home']})` } : {};

  const BG_PAGES: Array<{ key: string; label: string }> = [
    { key: 'home', label: t('admin.bgHome') },
    { key: 'lobby', label: t('admin.bgLobby') },
    { key: 'gameNight', label: t('admin.bgGameNight') },
    { key: 'gameDay', label: t('admin.bgGameDay') },
    { key: 'gameVoting', label: t('admin.bgGameVoting') },
    { key: 'gameEnded', label: t('admin.bgGameEnded') },
    { key: 'gameDefault', label: t('admin.bgGameDefault') },
  ];

  const BGM_TRACKS: Array<{ key: string; label: string }> = [
    { key: 'bgm-main', label: 'Main Theme' },
    { key: 'bgm-lobby', label: 'Lobby' },
    { key: 'bgm-night', label: 'Night' },
    { key: 'bgm-day', label: 'Day' },
    { key: 'bgm-voting', label: 'Voting' },
    { key: 'bgm-mafia-win', label: 'Mafia Win' },
    { key: 'bgm-town-win', label: 'Town Win' },
    { key: 'bgm-death', label: 'Death' },
  ];

  const SFX_LIST: Array<{ key: string; label: string }> = [
    { key: 'sfx-mafia-kill', label: t('admin.sfxMafiaKill') },
    { key: 'sfx-timer', label: t('admin.sfxTimer') },
    { key: 'sfx-night-fall', label: t('admin.sfxNightFall') },
    { key: 'sfx-day-break', label: t('admin.sfxDayBreak') },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6 text-[#8B0000]" />
            {t('admin.title')}
          </h1>
          <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> {t('admin.back')}
          </button>
        </div>

        {/* Live Preview */}
        <section className="card-glass p-5 space-y-4">
          <h2 className="section-title">
            <Eye className="w-4 h-4" />
            المعاينة المباشرة (Live Preview)
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPreviewTab('logo')}
              className={`px-3 py-1.5 text-xs rounded-lg ${previewTab === 'logo' ? 'bg-[#8B0000]/30 text-white' : 'bg-white/[0.03] text-gray-400'}`}
            >
              الشعار
            </button>
            <button
              onClick={() => setPreviewTab('hero')}
              className={`px-3 py-1.5 text-xs rounded-lg ${previewTab === 'hero' ? 'bg-[#8B0000]/30 text-white' : 'bg-white/[0.03] text-gray-400'}`}
            >
              الهيرو
            </button>
          </div>
          <div className="bg-[#0A0A0A] rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-[160px]" {...(previewTab === 'hero' ? { style: { ...bg, backgroundSize: 'cover', backgroundPosition: 'center' } as any } : {})}>
            {previewTab === 'logo' ? (
              <div className="flex flex-col items-center gap-3">
                <SiteLogo className="w-20 h-20 drop-shadow-[0_0_30px_rgba(139,0,0,0.4)]" alt="Preview" />
                <span className="text-lg font-bold">
                  {store.config.branding.name}{' '}
                  <span style={{ color: store.config.theme.primaryLight }}>{store.config.branding.nameAccent}</span>
                </span>
                <span className="text-xs text-gray-500">{store.config.branding.tagline}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl font-black">
                  {store.config.branding.name}{' '}
                  <span style={{ color: store.config.theme.primaryLight }}>{store.config.branding.nameAccent}</span>
                </span>
                <span className="text-sm text-gray-500">{store.config.branding.tagline}</span>
                <span className="text-xs text-gray-600 max-w-xs">{store.config.branding.description}</span>
              </div>
            )}
          </div>
        </section>

        {/* Branding */}
        <section className="card-glass p-5 space-y-4">
          <h2 className="section-title">
            <Type className="w-4 h-4" />
            {t('admin.branding')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('admin.brandName')}</label>
              <input className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#8B0000]/40" value={store.config.branding.name} onChange={(e) => store.updateBranding({ name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('admin.brandAccent')}</label>
              <input className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#8B0000]/40" value={store.config.branding.nameAccent} onChange={(e) => store.updateBranding({ nameAccent: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{t('admin.tagline')}</label>
              <input className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#8B0000]/40" value={store.config.branding.tagline} onChange={(e) => store.updateBranding({ tagline: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">{t('admin.description')}</label>
              <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#8B0000]/40 resize-none" rows={2} value={store.config.branding.description} onChange={(e) => store.updateBranding({ description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">شعار الموقع (Logo)</label>
              <FileUpload value={store.config.branding.logoUrl} onChange={(url) => store.updateBranding({ logoUrl: url })} accept="image/*" placeholder="ارفع صورة الشعار" />
              {store.config.branding.logoUrl?.trim() && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                  <SiteLogo className="w-10 h-10" alt="Logo preview" />
                  <span className="text-xs text-gray-500 truncate flex-1">{store.config.branding.logoUrl}</span>
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">أيقونة التبويب (Favicon)</label>
              <FileUpload value={store.config.branding.faviconUrl} onChange={(url) => store.updateBranding({ faviconUrl: url })} accept="image/*" placeholder="ارفع أيقونة الموقع (يفضل SVG أو PNG)" />
              {store.config.branding.faviconUrl?.trim() && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                  <img src={store.config.branding.faviconUrl} alt="" className="w-8 h-8 rounded" />
                  <span className="text-xs text-gray-500 truncate flex-1">{store.config.branding.faviconUrl}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Theme Colors */}
        <section className="card-glass p-5 space-y-4">
          <h2 className="section-title">
            <Palette className="w-4 h-4" />
            الألوان (Theme Colors)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { key: 'primary', label: 'Primary' },
              { key: 'primaryLight', label: 'Primary Light' },
              { key: 'gold', label: 'Gold' },
              { key: 'bgDark', label: 'Background' },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    value={store.config.theme[key]}
                    onChange={(e) => store.updateTheme({ [key]: e.target.value })}
                  />
                  <input
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-2 py-2 text-xs text-white font-mono outline-none focus:border-[#8B0000]/40"
                    value={store.config.theme[key]}
                    onChange={(e) => store.updateTheme({ [key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Backgrounds */}
        <section className="card-glass p-5 space-y-4">
          <h2 className="section-title">
            <Image className="w-4 h-4" />
            {t('admin.backgrounds')}
          </h2>
          <p className="text-xs text-gray-500">{t('admin.bgHint')}</p>
          <div className="grid grid-cols-1 gap-6">
            {BG_PAGES.map(({ key, label }) => (
              <div key={key} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                <label className="block text-xs font-medium text-gray-300">{label}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">{t('admin.bgRenderer')}</label>
                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#8B0000]/40" value={store.config.backgrounds[key]} onChange={(e) => store.updateBackground(key, e.target.value as BgKey)}>
                      {BG_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key} className="bg-[#0A0A0A]">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">{t('admin.bgImage')}</label>
                    <FileUpload value={store.config.bgImages[key] || ''} onChange={(url) => store.updateBgImage(key, url)} accept="image/*" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BGM */}
        <section className="card-glass p-5 space-y-4">
          <h2 className="section-title">
            <Music className="w-4 h-4" />
            {t('admin.bgmUrls')}
          </h2>
          <p className="text-xs text-gray-500">{t('admin.bgmHint')}</p>
          <div className="grid grid-cols-1 gap-4">
            {BGM_TRACKS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <FileUpload value={store.config.bgmUrls[key] || ''} onChange={(url) => store.updateBgmUrl(key, url)} accept=".mp3,.wav,.ogg" placeholder="https://example.com/track.mp3" />
              </div>
            ))}
          </div>
        </section>

        {/* SFX */}
        <section className="card-glass p-5 space-y-4">
          <h2 className="section-title">
            <Bell className="w-4 h-4" />
            {t('admin.soundEffects')}
          </h2>
          <p className="text-xs text-gray-500">{t('admin.sfxHint')}</p>
          <div className="grid grid-cols-1 gap-4">
            {SFX_LIST.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <FileUpload value={store.config.soundUrls[key] || ''} onChange={(url) => store.updateSoundUrl(key as any, url)} accept=".mp3,.wav,.ogg" placeholder="https://example.com/sound.wav" />
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="sticky bottom-4 bg-[#0A0A0A]/90 backdrop-blur-xl rounded-2xl border border-white/5 p-4 flex items-center justify-between gap-4">
          <button onClick={handleReset} disabled={status === 'saving'} className="btn-secondary text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> {t('admin.reset')}
          </button>
          <button onClick={handleSave} disabled={status === 'saving'} className="btn-primary text-sm flex items-center gap-2 px-6">
            {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'saved' ? <Save className="w-4 h-4 text-green-400" /> : status === 'error' ? <Save className="w-4 h-4 text-red-400" /> : <Save className="w-4 h-4" />}
            {status === 'saving' ? 'جاري الحفظ...' : status === 'saved' ? 'تم الحفظ ✓' : status === 'error' ? 'فشل!' : t('admin.save')}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
