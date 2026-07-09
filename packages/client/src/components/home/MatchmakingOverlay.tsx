import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocket } from '../../lib/socket';
import { X, Users, Clock } from 'lucide-react';

interface MatchmakingOverlayProps {
  onCancel: () => void;
}

export function MatchmakingOverlay({ onCancel }: MatchmakingOverlayProps) {
  const { t } = useTranslation();
  const [queueSize, setQueueSize] = useState(1);
  const [searchTime, setSearchTime] = useState(0);
  const [cancelText, setCancelText] = useState(t('matchmaking.cancel'));

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data: { queueSize: number }) => setQueueSize(data.queueSize);
    socket.on('matchmaking:update', handleUpdate);
    const timer = setInterval(() => setSearchTime((prev) => prev + 1), 1000);
    return () => { socket.off('matchmaking:update', handleUpdate); clearInterval(timer); };
  }, []);

  const handleCancel = useCallback(() => {
    setCancelText(t('matchmaking.cancelling'));
    setTimeout(() => onCancel(), 300);
  }, [onCancel, t]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-elevated p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto relative">
            <div className="absolute inset-0 border-2 border-[#8B0000]/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-t-[#8B0000] border-r-[#B22222] border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-4 border-2 border-t-[#FF4444] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="w-8 h-8 text-[#8B0000]" />
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{t('matchmaking.searching')}</h3>
        <p className="text-gray-400 text-sm mb-4">{t('matchmaking.playersInQueue', { count: queueSize })}</p>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
          <Clock className="w-4 h-4" />
          <span>{formatTime(searchTime)}</span>
        </div>

        <div className="flex justify-center gap-1.5 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < queueSize ? 'bg-[#8B0000] animate-pulse' : 'bg-gray-700'}`} style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>

        <button onClick={handleCancel} className="btn-danger flex items-center justify-center gap-2 w-full">
          <X className="w-4 h-4" />
          {cancelText}
        </button>
      </div>
    </div>
  );
}
