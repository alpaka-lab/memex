import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedBookmark } from '@/lib/db/test-utils';
import { setMockSession, createMockSession } from '@/__mocks__/auth-helpers';
import * as schema from '@/lib/db/schema';
import { createId } from '@paralleldrive/cuid2';

let testDb: ReturnType<typeof createTestDb>['db'];
let testSqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-for-generate-tags');
  const { sqlite, db } = createTestDb();
  testSqlite = sqlite;
  testDb = db;

  vi.doMock('@/lib/db', () => ({
    db: testDb,
    sqlite: testSqlite,
  }));
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/ai/generate-tags'), {
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
      provider: 'anthropic',
      apiKeyEncrypted: encrypt('sk-test-key'),
      autoTagEnabled: 1,
      autoSummaryEnabled: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .run();
}

describe('POST /api/ai/generate-tags', () => {
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
    const body = await res.json();
    expect(body.error).toBe('AI not configured');
  });

  it('returns 404 for bookmark not owned by user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    await seedAiSettings(userId);
    const bm = seedBookmark(testDb, otherUserId);

    // Mock the AI call to prevent actual API hit
    vi.doMock('@/lib/ai/generate-tags', () => ({
      generateTags: vi.fn(),
    }));

    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(404);
  });

  it('returns suggestions from AI provider', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    await seedAiSettings(userId);
    const bm = seedBookmark(testDb, userId, { title: 'Learn TypeScript' });

    vi.doMock('@/lib/ai/generate-tags', () => ({
      generateTags: vi.fn().mockResolvedValue([
        { name: 'typescript', confidence: 0.95 },
        { name: 'programming', confidence: 0.8 },
      ]),
    }));

    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.suggestions).toHaveLength(2);
    expect(body.suggestions[0].name).toBe('typescript');
  });

  it('returns 502 when AI provider fails', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    await seedAiSettings(userId);
    const bm = seedBookmark(testDb, userId);

    vi.doMock('@/lib/ai/generate-tags', () => ({
      generateTags: vi.fn().mockRejectedValue(new Error('Invalid API key')),
    }));

    const { POST } = await import('../route');
    const res = await POST(makeRequest({ bookmarkId: bm.id }));
    expect(res.status).toBe(502);
  });
});
