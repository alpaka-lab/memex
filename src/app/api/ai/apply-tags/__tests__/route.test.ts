import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedBookmark, seedTag } from '@/lib/db/test-utils';
import { setMockSession, createMockSession } from '@/__mocks__/auth-helpers';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let testDb: ReturnType<typeof createTestDb>['db'];
let testSqlite: ReturnType<typeof createTestDb>['sqlite'];

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

describe('POST /api/ai/apply-tags', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { POST } = await import('../route');
    const res = await POST(
      makeRequest('http://localhost:3000/api/ai/apply-tags', {
        method: 'POST',
        body: JSON.stringify({ bookmarkId: 'x', tags: ['test'] }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 without required fields', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await import('../route');

    const res = await POST(
      makeRequest('http://localhost:3000/api/ai/apply-tags', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it('creates new tags and links them with isAiGenerated', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, userId);
    const { POST } = await import('../route');

    const res = await POST(
      makeRequest('http://localhost:3000/api/ai/apply-tags', {
        method: 'POST',
        body: JSON.stringify({ bookmarkId: bm.id, tags: ['javascript', 'tutorial'] }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.applied).toBe(2);

    // Tags should exist
    const tags = testDb.select().from(schema.tags).where(eq(schema.tags.userId, userId)).all();
    expect(tags).toHaveLength(2);

    // Junction should have isAiGenerated = 1
    const junctions = testDb
      .select()
      .from(schema.bookmarkTags)
      .where(eq(schema.bookmarkTags.bookmarkId, bm.id))
      .all();
    expect(junctions).toHaveLength(2);
    expect(junctions.every((j) => j.isAiGenerated === 1)).toBe(true);
  });

  it('reuses existing tags by name', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, userId);
    seedTag(testDb, userId, { name: 'javascript' });
    const { POST } = await import('../route');

    await POST(
      makeRequest('http://localhost:3000/api/ai/apply-tags', {
        method: 'POST',
        body: JSON.stringify({ bookmarkId: bm.id, tags: ['javascript', 'new-tag'] }),
      })
    );

    // Should still be only 2 tags total (reused javascript + new-tag)
    const tags = testDb.select().from(schema.tags).where(eq(schema.tags.userId, userId)).all();
    expect(tags).toHaveLength(2);
    expect(tags.map((t) => t.name).sort()).toEqual(['javascript', 'new-tag']);
  });

  it('returns 404 for bookmark owned by another user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, otherUserId);
    const { POST } = await import('../route');

    const res = await POST(
      makeRequest('http://localhost:3000/api/ai/apply-tags', {
        method: 'POST',
        body: JSON.stringify({ bookmarkId: bm.id, tags: ['hacked'] }),
      })
    );
    expect(res.status).toBe(404);
  });

  it('handles duplicate tag application gracefully', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, userId);
    const tag = seedTag(testDb, userId, { name: 'existing' });
    // Manually link tag
    testDb
      .insert(schema.bookmarkTags)
      .values({ bookmarkId: bm.id, tagId: tag.id, isAiGenerated: 0 })
      .run();

    const { POST } = await import('../route');
    const res = await POST(
      makeRequest('http://localhost:3000/api/ai/apply-tags', {
        method: 'POST',
        body: JSON.stringify({ bookmarkId: bm.id, tags: ['existing'] }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.applied).toBe(0); // Already existed, not re-applied
  });
});
