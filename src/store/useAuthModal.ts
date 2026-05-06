import { create } from 'zustand';

interface AuthModalStore {
  isOpen: boolean;
  mode: 'login' | 'signup' | 'verify' | 'forgot' | 'reset';
  open: (mode?: 'login' | 'signup' | 'verify' | 'forgot' | 'reset') => void;
  close: () => void;
  setMode: (mode: 'login' | 'signup' | 'verify' | 'forgot' | 'reset') => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',
  open: (mode = 'login') => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));
