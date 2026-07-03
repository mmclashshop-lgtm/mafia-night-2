import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { AuthModal } from '../auth/AuthModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { userId, name, avatar } = useAuthStore();
  const { reconnect } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const storedId = userId;
    const storedName = name;
    const storedAvatar = avatar ?? '';

    if (storedId && storedName) {
      reconnect(storedId, storedName, storedAvatar).then(() => {
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
  }, []); // only on mount

  useEffect(() => {
    if (!checking) {
      setShowModal(!userId);
    }
  }, [checking, userId]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
      {children}
    </>
  );
}
