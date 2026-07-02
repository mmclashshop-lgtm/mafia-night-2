import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIStore {
  toasts: Toast[];
  modal: string | null;
  modalData: unknown;

  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  modal: null,
  modalData: null,

  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  openModal: (modal, data) => set({ modal, modalData: data }),
  closeModal: () => set({ modal: null, modalData: null }),
}));
