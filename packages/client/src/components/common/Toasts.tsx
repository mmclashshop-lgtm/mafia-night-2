import { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const toastStyles = {
  success: 'bg-green-900/90 border-green-700 text-green-200',
  error: 'bg-red-900/90 border-red-700 text-red-200',
  info: 'bg-[#1A1A1A] border-[#333] text-gray-200',
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast }: { toast: { id: string; type: 'success' | 'error' | 'info'; message: string } }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, removeToast]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg border shadow-xl animate-slide-up min-w-[280px] max-w-sm backdrop-blur-sm',
        toastStyles[toast.type]
      )}
    >
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 hover:bg-black/20 rounded transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 md:bottom-20 right-4 z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
