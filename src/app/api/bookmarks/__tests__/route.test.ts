import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedBookmark, seedTag, seedCollection } from '@/lib/db/test-utils';
import { setMockSession, createMockSession } from '@/__mocks__/auth-helpers';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/bookmarks', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { GET } = await importRoute();
    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks'));
    expect(res.status).toBe(401);
  });

  it('returns empty list for user with no bookmarks', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it('returns bookmarks for authenticated user', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, { title: 'Bookmark 1' });
    seedBookmark(testDb, userId, { title: 'Bookmark 2' });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks'));
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });

  it('does not return other users bookmarks', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, { title: 'My bookmark' });
    seedBookmark(testDb, otherUserId, { title: 'Not mine' });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks'));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('My bookmark');
  });

  it('filters by starred', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, { title: 'Starred', isStarred: 1 });
    seedBookmark(testDb, userId, { title: 'Not starred', isStarred: 0 });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?starred=1'));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Starred');
  });

  it('filters by archived', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, { title: 'Archived', isArchived: 1 });
    seedBookmark(testDb, userId, { title: 'Active', isArchived: 0 });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?archived=1'));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Archived');
  });

  it('filters by collection', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const col = seedCollection(testDb, userId);
    seedBookmark(testDb, userId, { title: 'In collection', collectionId: col.id });
    seedBookmark(testDb, userId, { title: 'No collection' });
    const { GET } = await importRoute();

    const res = await GET(
      makeRequest(`http://localhost:3000/api/bookmarks?collectionId=${col.id}`)
    );
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('In collection');
  });

  it('filters by tag', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const tag = seedTag(testDb, userId, { name: 'javascript' });
    const bm = seedBookmark(testDb, userId, { title: 'Tagged' });
    seedBookmark(testDb, userId, { title: 'Untagged' });

    testDb.insert(schema.bookmarkTags).values({ bookmarkId: bm.id, tagId: tag.id }).run();

    const { GET } = await importRoute();
    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?tag=javascript'));
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Tagged');
  });

  it('returns empty for non-existent tag', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId);
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?tag=nonexistent'));
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('paginates with cursor', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));

    // Create bookmarks with staggered timestamps
    for (let i = 0; i < 5; i++) {
      const date = new Date(2024, 0, i + 1);
      seedBookmark(testDb, userId, { title: `BM ${i}`, createdAt: date, updatedAt: date });
    }

    const { GET } = await importRoute();
    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?limit=3'));
    const body = await res.json();
    expect(body.data).toHaveLength(3);
    expect(body.nextCursor).not.toBeNull();

    // Fetch next page
    const res2 = await GET(
      makeRequest(`http://localhost:3000/api/bookmarks?limit=3&cursor=${body.nextCursor}`)
    );
    const body2 = await res2.json();
    expect(body2.data).toHaveLength(2);
    expect(body2.nextCursor).toBeNull();
  });

  it('sorts by oldest', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, {
      title: 'Old',
      createdAt: new Date(2023, 0, 1),
      updatedAt: new Date(2023, 0, 1),
    });
    seedBookmark(testDb, userId, {
      title: 'New',
      createdAt: new Date(2024, 0, 1),
      updatedAt: new Date(2024, 0, 1),
    });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?sort=oldest'));
    const body = await res.json();
    expect(body.data[0].title).toBe('Old');
    expect(body.data[1].title).toBe('New');
  });

  it('sorts by title-asc', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedBookmark(testDb, userId, { title: 'Zebra' });
    seedBookmark(testDb, userId, { title: 'Alpha' });
    const { GET } = await importRoute();

    const res = await GET(makeRequest('http://localhost:3000/api/bookmarks?sort=title-asc'));
    const body = await res.json();
    expect(body.data[0].title).toBe('Alpha');
    expect(body.data[1].title).toBe('Zebra');
  });
});

describe('POST /api/bookmarks', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest('http://localhost:3000/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('creates a bookmark', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await importRoute();

    const res = await POST(
      makeRequest('http://localhost:3000/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com',
          title: 'Example',
          description: 'An example site',
          domain: 'example.com',
        }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toBe('https://example.com');
    expect(body.title).toBe('Example');
    expect(body.userId).toBe(userId);

    // Verify in DB
    const rows = testDb
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, userId))
      .all();
    expect(rows).toHaveLength(1);
  });
});
