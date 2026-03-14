import { create } from 'zustand';

export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'domain';

interface ViewStore {
  view: 'grid' | 'list';
  sort: SortOption;
  setView: (view: 'grid' | 'list') => void;
  setSort: (sort: SortOption) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  view: 'grid',
  sort: 'newest',
  setView: (view) => set({ view }),
  setSort: (sort) => set({ sort }),
}));
