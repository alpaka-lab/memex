import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedBookmark } from '@/lib/db/test-utils';
import { setMockSession, createMockSession } from '@/__mocks__/auth-helpers';

let testSqlite: ReturnType<typeof createTestDb>['sqlite'];
let testDb: ReturnType<typeof createTestDb>['db'];

beforeEach(() => {
  vi.resetModules();
  const { sqlite, db } = createTestDb();
  testSqlite = sqlite;
  testDb = db;

  vi.doMock('@/lib/db', () => ({
    db: testDb,
    sqlite: testSqlite,
  }));
});

async function importRoute() {
  return await import('../route');
}

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/search', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { GET } = await importRoute();
    const res = await GET(makeRequest('http://localhost:3000/api/search?q=test'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when q param is missing', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/search'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when q param is empty', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/search?q='));
    expect(res.status).toBe(400);
  });

  it('returns FTS5 search results', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, {
      title: 'JavaScript Tutorial',
      description: 'Learn JavaScript',
    });
    seedBookmark(testDb, userId, {
      title: 'Python Guide',
      description: 'Learn Python',
    });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/search?q=JavaScript'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('JavaScript Tutorial');
  });

  it('returns isStarred and isArchived fields', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, {
      title: 'Starred Bookmark',
      isStarred: 1,
      isArchived: 1,
    });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/search?q=Starred'));
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].isStarred).toBe(1);
    expect(body[0].isArchived).toBe(1);
  });

  it('does not return other users results', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, { title: 'My Unique Bookmark' });
    seedBookmark(testDb, otherUserId, { title: 'Other Unique Bookmark' });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/search?q=Unique'));
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('My Unique Bookmark');
  });
});
