import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedTag, seedBookmark } from '@/lib/db/test-utils';
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

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/tags', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns tags for user', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedTag(testDb, userId, { name: 'javascript' });
    seedTag(testDb, userId, { name: 'react' });
    const { GET } = await import('../route');

    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});

describe('POST /api/tags', () => {
  it('creates a tag', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await import('../route');

    const res = await POST(
      makeRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'typescript', color: '#3178c6' }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('typescript');
    expect(body.color).toBe('#3178c6');
  });
});

describe('PATCH /api/tags/:id', () => {
  it('updates a tag', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const tag = seedTag(testDb, userId, { name: 'old-name' });
    const { PATCH } = await import('../[id]/route');

    const res = await PATCH(
      makeRequest(`http://localhost:3000/api/tags/${tag.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'new-name' }),
      }),
      makeParams(tag.id)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('new-name');
  });

  it('returns 404 for wrong user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const tag = seedTag(testDb, otherUserId);
    const { PATCH } = await import('../[id]/route');

    const res = await PATCH(
      makeRequest(`http://localhost:3000/api/tags/${tag.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'hacked' }),
      }),
      makeParams(tag.id)
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tags/:id', () => {
  it('deletes a tag and removes associations', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const tag = seedTag(testDb, userId);
    const bm = seedBookmark(testDb, userId);
    testDb.insert(schema.bookmarkTags).values({ bookmarkId: bm.id, tagId: tag.id }).run();

    const { DELETE } = await import('../[id]/route');
    const res = await DELETE(
      makeRequest(`http://localhost:3000/api/tags/${tag.id}`),
      makeParams(tag.id)
    );

    expect(res.status).toBe(200);

    // Tag should be gone
    const tags = testDb.select().from(schema.tags).where(eq(schema.tags.id, tag.id)).all();
    expect(tags).toHaveLength(0);

    // Junction should be gone
    const junctions = testDb
      .select()
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.tagId, tag.id))
      .all();
    expect(junctions).toHaveLength(0);

    // Bookmark should still exist
    const bookmarks = testDb
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.id, bm.id))
      .all();
    expect(bookmarks).toHaveLength(1);
  });

  it('returns 404 for wrong user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const tag = seedTag(testDb, otherUserId);
    const { DELETE } = await import('../[id]/route');

    const res = await DELETE(
      makeRequest(`http://localhost:3000/api/tags/${tag.id}`),
      makeParams(tag.id)
    );
    expect(res.status).toBe(404);
  });
});
