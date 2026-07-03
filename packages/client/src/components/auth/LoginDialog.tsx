import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { X, Zap, User } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
    FB?: {
      init: (config: { appId: string; version: string; status: boolean; cookie: boolean; xfbml: boolean }) => void;
      login: (cb: (res: { authResponse?: { accessToken: string; userID: string }; status?: string }) => void, config: { scope: string }) => void;
      api: (path: string, params: { fields: string }, cb: (res: { name?: string; picture?: { data?: { url?: string } } }) => void) => void;
    };
    fbAsyncInit: () => void;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onGuestLogin: (name: string) => void;
}

export function LoginDialog({ open, onClose, onGuestLogin }: LoginDialogProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { addToast } = useUIStore();
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState<'google' | 'facebook' | 'guest' | null>(null);

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      addToast('error', 'Google Login is not configured. Add VITE_GOOGLE_CLIENT_ID to .env');
      return;
    }
    setLoading('google');
    const google = window.google;
    if (!google) {
      addToast('error', 'Google SDK not loaded');
      setLoading(null);
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (res) => {
        try {
          const resp = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: res.credential }),
          });
          const data = await resp.json();
          if (resp.ok) {
            login(data.userId, data.name, data.avatar, data.profile);
            addToast('success', `Welcome, ${data.name}!`);
            onClose();
          } else {
            addToast('error', data.error || 'Google login failed');
          }
        } catch {
          addToast('error', 'Server error during Google login');
        } finally {
          setLoading(null);
        }
      },
    });
  };

  const handleFacebookLogin = () => {
    if (!FACEBOOK_APP_ID) {
      addToast('error', 'Facebook Login is not configured. Add VITE_FACEBOOK_APP_ID to .env');
      return;
    }
    setLoading('facebook');
    const FB = window.FB;
    if (!FB) {
      addToast('error', 'Facebook SDK not loaded');
      setLoading(null);
      return;
    }
    FB.login(async (res) => {
      if (res.authResponse) {
        try {
          FB.api('/me', { fields: 'name,picture' }, async (fbData) => {
            const resp = await fetch('/api/auth/facebook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: res.authResponse?.accessToken,
                userId: res.authResponse?.userID,
                name: fbData.name,
                avatar: fbData.picture?.data?.url,
              }),
            });
            const data = await resp.json();
            if (resp.ok) {
              login(data.userId, data.name, data.avatar, data.profile);
              addToast('success', `Welcome, ${data.name}!`);
              onClose();
            } else {
              addToast('error', data.error || 'Facebook login failed');
            }
          });
        } catch {
          addToast('error', 'Server error during Facebook login');
        } finally {
          setLoading(null);
        }
      } else {
        addToast('error', 'Facebook login cancelled');
        setLoading(null);
      }
    }, { scope: 'public_profile' });
  };

  const handleGuestLogin = () => {
    if (!guestName.trim()) return;
    setLoading('guest');
    onGuestLogin(guestName.trim());
    setLoading(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-glow p-6 w-full max-w-sm relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-1">{t('auth.welcome', 'Welcome to Mafia Night')}</h2>
          <p className="text-sm text-gray-400">{t('auth.chooseMethod', 'Sign in to play')}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium">Google</span>
          </button>

          <button
            onClick={handleFacebookLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/30 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="font-medium">Facebook</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#1A1A1A] text-gray-500">{t('auth.or', 'or')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t('home.cta.namePlaceholder', 'Enter your name')}
              className="input-field text-center"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
            />
            <button
              onClick={handleGuestLogin}
              disabled={!guestName.trim() || loading !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary"
            >
              {loading === 'guest' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><User className="w-4 h-4" /> {t('auth.playAsGuest', 'Play as Guest')}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
