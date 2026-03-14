import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selection-store';

beforeEach(() => {
  useSelectionStore.setState({ selectedIds: new Set(), isSelecting: false });
});

describe('selection-store', () => {
  it('starts empty', () => {
    const state = useSelectionStore.getState();
    expect(state.selectedIds.size).toBe(0);
    expect(state.isSelecting).toBe(false);
  });

  it('toggle adds and removes', () => {
    useSelectionStore.getState().toggle('a');
    expect(useSelectionStore.getState().selectedIds.has('a')).toBe(true);
    expect(useSelectionStore.getState().isSelecting).toBe(true);

    useSelectionStore.getState().toggle('a');
    expect(useSelectionStore.getState().selectedIds.has('a')).toBe(false);
    expect(useSelectionStore.getState().isSelecting).toBe(false);
  });

  it('select adds without removing', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().select('b');
    expect(useSelectionStore.getState().selectedIds.size).toBe(2);
  });

  it('deselect removes single item', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().select('b');
    useSelectionStore.getState().deselect('a');
    expect(useSelectionStore.getState().selectedIds.has('a')).toBe(false);
    expect(useSelectionStore.getState().selectedIds.has('b')).toBe(true);
    expect(useSelectionStore.getState().isSelecting).toBe(true);
  });

  it('deselect last item sets isSelecting to false', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().deselect('a');
    expect(useSelectionStore.getState().isSelecting).toBe(false);
  });

  it('selectAll replaces selection', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().selectAll(['x', 'y', 'z']);
    expect(useSelectionStore.getState().selectedIds.size).toBe(3);
    expect(useSelectionStore.getState().selectedIds.has('a')).toBe(false);
    expect(useSelectionStore.getState().isSelecting).toBe(true);
  });

  it('selectAll with empty array sets isSelecting false', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().selectAll([]);
    expect(useSelectionStore.getState().isSelecting).toBe(false);
  });

  it('clear resets everything', () => {
    useSelectionStore.getState().select('a');
    useSelectionStore.getState().select('b');
    useSelectionStore.getState().clear();
    expect(useSelectionStore.getState().selectedIds.size).toBe(0);
    expect(useSelectionStore.getState().isSelecting).toBe(false);
  });

  it('enableSelecting and disableSelecting', () => {
    useSelectionStore.getState().enableSelecting();
    expect(useSelectionStore.getState().isSelecting).toBe(true);

    useSelectionStore.getState().select('a');
    useSelectionStore.getState().disableSelecting();
    expect(useSelectionStore.getState().isSelecting).toBe(false);
    expect(useSelectionStore.getState().selectedIds.size).toBe(0);
  });
});
