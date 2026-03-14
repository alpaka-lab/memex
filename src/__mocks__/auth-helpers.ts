import { vi } from 'vitest';

type MockSession = {
  user: { id: string; email: string; name: string };
  session: { id: string };
} | null;

let mockSession: MockSession = null;

export function setMockSession(session: MockSession) {
  mockSession = session;
}

export function createMockSession(userId: string) {
  return {
    user: { id: userId, email: `${userId}@test.com`, name: 'Test User' },
    session: { id: 'test-session-1' },
  };
}

// These will be hoisted to the top level by vitest automatically
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve(mockSession)),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));
