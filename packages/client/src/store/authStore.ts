import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthState {
  name: string | null;
}

interface AuthActions {
  setName: (name: string) => void;
  logout: () => void;
}

const initialState: AuthState = {
  name: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set): AuthActions & AuthState => ({
      ...initialState,
      setName: (name: string) => {
        set({ name });
      },
      logout: () => {
        set(initialState);
      },
    })
  )
);
