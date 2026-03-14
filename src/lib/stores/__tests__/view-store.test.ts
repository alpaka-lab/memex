import { describe, it, expect, beforeEach } from 'vitest';
import { useViewStore } from '../view-store';

beforeEach(() => {
  useViewStore.setState({ view: 'grid', sort: 'newest' });
});

describe('view-store', () => {
  it('defaults to grid view and newest sort', () => {
    const state = useViewStore.getState();
    expect(state.view).toBe('grid');
    expect(state.sort).toBe('newest');
  });

  it('setView changes view', () => {
    useViewStore.getState().setView('list');
    expect(useViewStore.getState().view).toBe('list');
    useViewStore.getState().setView('grid');
    expect(useViewStore.getState().view).toBe('grid');
  });

  it('setSort changes sort', () => {
    useViewStore.getState().setSort('oldest');
    expect(useViewStore.getState().sort).toBe('oldest');
    useViewStore.getState().setSort('title-asc');
    expect(useViewStore.getState().sort).toBe('title-asc');
    useViewStore.getState().setSort('domain');
    expect(useViewStore.getState().sort).toBe('domain');
  });
});
