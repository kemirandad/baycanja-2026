import { create } from 'zustand';
import type { User } from '@/lib/types';

type ScoresState = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
};

export const useScoresStore = create<ScoresState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  _hasHydrated: false,
  setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
}));
