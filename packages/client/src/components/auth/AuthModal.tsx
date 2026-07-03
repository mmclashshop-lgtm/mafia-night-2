import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Loader2, LogIn, UserPlus, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const [isLoginView, setIsLoginView] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userId, name, avatar, setAuth, updateProfile } = useAuthStore();
  const { login, reconnect } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setNameInput('');
      setError(null);
      setIsLoginView(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userId && name && avatar) {
      onClose();
    }
  }, [userId, name, avatar, onClose]);

  const handleGuestLogin = async () => {
    if (!nameInput.trim()) {
      setError(t('auth.enterName'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      if (!response.ok) {
        throw new Error(t('auth.failedLogin'));
      }

      const data = await response.json();
      setAuth(data.userId, data.name, data.avatar, data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!userId) {
      setError(t('auth.noUserId'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: nameInput.trim() || name || 'Unknown' }),
      });

      if (!response.ok) {
        throw new Error(t('auth.reconnectFailed'));
      }

      const data = await response.json();
      setAuth(data.userId, data.name, data.avatar, data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-[#8B0000] to-red-800 p-3">
              {isLoginView ? (
                <LogIn className="h-6 w-6 text-white" />
              ) : (
                <UserPlus className="h-6 w-6 text-white" />
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {isLoginView ? t('auth.welcome') : t('auth.createAccount')}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {isLoginView
              ? t('auth.signInToContinue')
              : t('auth.startYourJourney')
            }
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name-input" className="mb-2 block text-sm font-medium text-gray-300">
              {t('auth.yourName')} *
            </label>
            <input
              id="name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t('auth.enterNamePlaceholder')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-[#8B0000] focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20"
              disabled={isLoading}
              maxLength={20}
            />
          </div>

          <button
            onClick={isLoginView ? handleReconnect : handleGuestLogin}
            disabled={isLoading || !nameInput.trim()}
            className="w-full rounded-lg bg-gradient-to-r from-[#8B0000] to-red-800 py-3 font-medium text-white transition-all duration-200 hover:from-red-800 hover:to-[#8B0000] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : isLoginView ? (
              t('auth.reconnect')
            ) : (
              t('auth.continueAsGuest')
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-sm text-gray-400 transition-colors hover:text-white"
              disabled={isLoading}
            >
              {isLoginView
                ? t('auth.noAccount')
                : t('auth.alreadyHaveAccount')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}