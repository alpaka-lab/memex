import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedBookmark } from '@/lib/db/test-utils';
import { setMockSession, createMockSession } from '@/__mocks__/auth-helpers';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

let testDb: ReturnType<typeof createTestDb>['db'];
let testSqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-for-generate-summary');
  const { sqlite, db } = createTestDb();
  testSqlite = sqlite;
  testDb = db;

  vi.doMock('@/lib/db', () => ({
    db: testDb,
    sqlite: testSqlite,
  }));
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/ai/generate-summary'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function seedAiSettings(userId: string) {
  const { encrypt } = await import('@/lib/crypto');
  testDb
    .insert(schema.userAiSettings)
    .values({
      id: createId(),
      userId,
      provider: 'openai',
      apiKeyEncrypted: encrypt('sk-test-key'),
      autoTagEnabled: 0,
      autoSummaryEnabled: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
}

describe('POST /api/ai/generate-summary', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: 'x' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 without bookmarkId', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await import('../route');

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when AI not configured', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const bm = seedBookmark(testDb, userId);
    const { POST } = await import('../route');

    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(400);
  });

  it('generates summary and saves to bookmark', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    await seedAiSettings(userId);
    const bm = seedBookmark(testDb, userId, { title: 'Learn TypeScript' });

    const mockSummary = 'A comprehensive guide to TypeScript. Covers types, interfaces, and advanced patterns.';
    vi.doMock('@/lib/ai/generate-summary', () => ({
      generateSummary: vi.fn().mockResolvedValue(mockSummary),
    }));

    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.summary).toBe(mockSummary);

    // Summary should be persisted in DB
    const updated = testDb
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.id, bm.id))
      .all();
    expect(updated[0].summary).toBe(mockSummary);
  });

  it('returns 502 when AI provider fails', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    await seedAiSettings(userId);
    const bm = seedBookmark(testDb, userId);

    vi.doMock('@/lib/ai/generate-summary', () => ({
      generateSummary: vi.fn().mockRejectedValue(new Error('Rate limited')),
    }));

    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('Check your API key');
  });

  it('returns 404 for bookmark owned by other user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    await seedAiSettings(userId);
    const bm = seedBookmark(testDb, otherUserId);

    vi.doMock('@/lib/ai/generate-summary', () => ({
      generateSummary: vi.fn(),
    }));

    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(404);
  });
});
