import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createTestDb,
  seedTestUser,
  seedBookmark,
  seedTag,
  seedCollection,
} from '@/lib/db/test-utils';
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
  return await import('../bulk/route');
}

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost:3000/api/bookmarks/bulk'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/bookmarks/bulk', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: ['a'], action: 'delete' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when no IDs provided', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await importRoute();

    const res = await POST(makeRequest({ ids: [], action: 'delete' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when no action provided', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await importRoute();

    const res = await POST(makeRequest({ ids: ['a'] }));
    expect(res.status).toBe(400);
  });

  it('bulk deletes bookmarks', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm1 = seedBookmark(testDb, userId);
    const bm2 = seedBookmark(testDb, userId);
    const tag = seedTag(testDb, userId);
    testDb.insert(schema.bookmarkTags).values({ bookmarkId: bm1.id, tagId: tag.id }).run();

    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: [bm1.id, bm2.id], action: 'delete' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.affected).toBe(2);

    const remaining = testDb.select().from(schema.bookmarks).all();
    expect(remaining).toHaveLength(0);
  });

  it('bulk archives bookmarks', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm1 = seedBookmark(testDb, userId);
    const bm2 = seedBookmark(testDb, userId);

    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: [bm1.id, bm2.id], action: 'archive' }));

    expect(res.status).toBe(200);
    const rows = testDb.select().from(schema.bookmarks).all();
    expect(rows.every((r) => r.isArchived === 1)).toBe(true);
  });

  it('bulk unarchives bookmarks', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm1 = seedBookmark(testDb, userId, { isArchived: 1 });
    const bm2 = seedBookmark(testDb, userId, { isArchived: 1 });

    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: [bm1.id, bm2.id], action: 'unarchive' }));

    expect(res.status).toBe(200);
    const rows = testDb.select().from(schema.bookmarks).all();
    expect(rows.every((r) => r.isArchived === 0)).toBe(true);
  });

  it('bulk stars bookmarks', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm1 = seedBookmark(testDb, userId);
    const bm2 = seedBookmark(testDb, userId);

    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: [bm1.id, bm2.id], action: 'star' }));

    expect(res.status).toBe(200);
    const rows = testDb.select().from(schema.bookmarks).all();
    expect(rows.every((r) => r.isStarred === 1)).toBe(true);
  });

  it('bulk unstars bookmarks', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm1 = seedBookmark(testDb, userId, { isStarred: 1 });
    const bm2 = seedBookmark(testDb, userId, { isStarred: 1 });

    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: [bm1.id, bm2.id], action: 'unstar' }));

    expect(res.status).toBe(200);
    const rows = testDb.select().from(schema.bookmarks).all();
    expect(rows.every((r) => r.isStarred === 0)).toBe(true);
  });

  it('bulk moves bookmarks to collection', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const col = seedCollection(testDb, userId);
    const bm1 = seedBookmark(testDb, userId);
    const bm2 = seedBookmark(testDb, userId);

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ids: [bm1.id, bm2.id], action: 'move', data: { collectionId: col.id } })
    );

    expect(res.status).toBe(200);
    const rows = testDb.select().from(schema.bookmarks).all();
    expect(rows.every((r) => r.collectionId === col.id)).toBe(true);
  });

  it('ignores bookmarks not owned by user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const myBm = seedBookmark(testDb, userId);
    const otherBm = seedBookmark(testDb, otherUserId);

    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ids: [myBm.id, otherBm.id], action: 'star' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.affected).toBe(1);

    // Other user's bookmark should not be starred
    const otherRow = testDb
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.id, otherBm.id))
      .all();
    expect(otherRow[0].isStarred).toBe(0);
  });
});
