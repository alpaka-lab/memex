import { describe, it, expect, beforeEach } from 'vitest';
import { useSidebarStore } from '../sidebar-store';

beforeEach(() => {
  useSidebarStore.setState({ isOpen: true });
});

describe('sidebar-store', () => {
  it('defaults to open', () => {
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it('toggle flips state', () => {
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isOpen).toBe(false);
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it('open sets to true', () => {
    useSidebarStore.getState().close();
    useSidebarStore.getState().open();
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it('close sets to false', () => {
    useSidebarStore.getState().close();
    expect(useSidebarStore.getState().isOpen).toBe(false);
  });
});
