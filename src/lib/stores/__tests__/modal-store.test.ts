import { describe, it, expect, beforeEach } from 'vitest';
import { useModalStore } from '../modal-store';

beforeEach(() => {
  useModalStore.setState({ isQuickAddOpen: false, detailBookmarkId: null });
});

describe('modal-store', () => {
  it('defaults to closed state', () => {
    const state = useModalStore.getState();
    expect(state.isQuickAddOpen).toBe(false);
    expect(state.detailBookmarkId).toBeNull();
  });

  it('openQuickAdd and closeQuickAdd', () => {
    useModalStore.getState().openQuickAdd();
    expect(useModalStore.getState().isQuickAddOpen).toBe(true);
    useModalStore.getState().closeQuickAdd();
    expect(useModalStore.getState().isQuickAddOpen).toBe(false);
  });

  it('openDetail and closeDetail', () => {
    useModalStore.getState().openDetail('bookmark-1');
    expect(useModalStore.getState().detailBookmarkId).toBe('bookmark-1');
    useModalStore.getState().closeDetail();
    expect(useModalStore.getState().detailBookmarkId).toBeNull();
  });

  it('openDetail replaces previous', () => {
    useModalStore.getState().openDetail('bookmark-1');
    useModalStore.getState().openDetail('bookmark-2');
    expect(useModalStore.getState().detailBookmarkId).toBe('bookmark-2');
  });
});
