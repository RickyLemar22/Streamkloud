import { create } from 'zustand';

type AuthMode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

interface AuthModalStore {
  isOpen: boolean;
  mode: AuthMode;
  open: (mode?: AuthMode) => void;
  close: () => void;
  setMode: (mode: AuthMode) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',

  open: (mode = 'login') => set({ isOpen: true, mode }),

  close: () => set({ isOpen: false }),

  setMode: (mode) => set({ mode, isOpen: true }),
}));