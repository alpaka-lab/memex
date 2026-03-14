import { create } from 'zustand';

interface SelectionStore {
  selectedIds: Set<string>;
  isSelecting: boolean;
  toggle: (id: string) => void;
  select: (id: string) => void;
  deselect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
  enableSelecting: () => void;
  disableSelecting: () => void;
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedIds: new Set(),
  isSelecting: false,
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next, isSelecting: next.size > 0 };
    }),
  select: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.add(id);
      return { selectedIds: next, isSelecting: true };
    }),
  deselect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.delete(id);
      return { selectedIds: next, isSelecting: next.size > 0 };
    }),
  selectAll: (ids) =>
    set(() => ({
      selectedIds: new Set(ids),
      isSelecting: ids.length > 0,
    })),
  clear: () => set({ selectedIds: new Set(), isSelecting: false }),
  enableSelecting: () => set({ isSelecting: true }),
  disableSelecting: () => set({ selectedIds: new Set(), isSelecting: false }),
}));
