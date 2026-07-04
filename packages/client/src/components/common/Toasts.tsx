import { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const toastConfig = {
  success: { styles: 'bg-green-900/80 border-green-700/50 text-green-200', icon: CheckCircle },
  error: { styles: 'bg-red-900/80 border-red-700/50 text-red-200', icon: AlertCircle },
  info: { styles: 'bg-[#1A1A1A]/80 border-[#333]/50 text-gray-200', icon: Info },
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast }: { toast: { id: string; type: 'success' | 'error' | 'info'; message: string } }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    timerRef.current = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, removeToast]);

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl animate-slide-up backdrop-blur-xl',
        config.styles
      )}
      style={{ minWidth: '280px', maxWidth: '360px' }}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-70" />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-black/20 rounded transition-colors opacity-50 hover:opacity-100">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
