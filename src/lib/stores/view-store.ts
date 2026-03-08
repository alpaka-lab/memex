import { create } from 'zustand';

interface ViewStore {
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  view: 'grid',
  setView: (view) => set({ view }),
}));
