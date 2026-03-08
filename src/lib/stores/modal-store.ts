import { create } from 'zustand';

interface ModalStore {
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  detailBookmarkId: string | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isQuickAddOpen: false,
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
  detailBookmarkId: null,
  openDetail: (id: string) => set({ detailBookmarkId: id }),
  closeDetail: () => set({ detailBookmarkId: null }),
}));
