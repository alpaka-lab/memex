import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedBookmark, seedTag } from '@/lib/db/test-utils';
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
  return await import('../[id]/route');
}

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/bookmarks/:id', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { PATCH } = await importRoute();
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/bookmarks/abc', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      }),
      makeParams('abc')
    );
    expect(res.status).toBe(401);
  });

  it('updates allowed fields', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, userId, { title: 'Original' });
    const { PATCH } = await importRoute();

    const res = await PATCH(
      makeRequest(`http://localhost:3000/api/bookmarks/${bm.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated', isStarred: 1 }),
      }),
      makeParams(bm.id)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated');
    expect(body.isStarred).toBe(1);
  });

  it('returns 404 for wrong user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, otherUserId);
    const { PATCH } = await importRoute();

    const res = await PATCH(
      makeRequest(`http://localhost:3000/api/bookmarks/${bm.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Hacked' }),
      }),
      makeParams(bm.id)
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent bookmark', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { PATCH } = await importRoute();

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/bookmarks/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      }),
      makeParams('nonexistent')
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/bookmarks/:id', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { DELETE } = await importRoute();
    const res = await DELETE(
      makeRequest('http://localhost:3000/api/bookmarks/abc'),
      makeParams('abc')
    );
    expect(res.status).toBe(401);
  });

  it('deletes bookmark and cascade tags', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, userId);
    const tag = seedTag(testDb, userId);
    testDb.insert(schema.bookmarkTags).values({ bookmarkId: bm.id, tagId: tag.id }).run();

    const { DELETE } = await importRoute();
    const res = await DELETE(
      makeRequest(`http://localhost:3000/api/bookmarks/${bm.id}`),
      makeParams(bm.id)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify bookmark is gone
    const rows = testDb.select().from(schema.bookmarks).where(eq(schema.bookmarks.id, bm.id)).all();
    expect(rows).toHaveLength(0);

    // Verify bookmark_tags junction is gone
    const tagRows = testDb
      .select()
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.bookmarkId, bm.id))
      .all();
    expect(tagRows).toHaveLength(0);
  });

  it('returns 404 for wrong user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, otherUserId);

    const { DELETE } = await importRoute();
    const res = await DELETE(
      makeRequest(`http://localhost:3000/api/bookmarks/${bm.id}`),
      makeParams(bm.id)
    );
    expect(res.status).toBe(404);
  });
});
