import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser } from '@/lib/db/test-utils';
import { setMockSession, createMockSession } from '@/__mocks__/auth-helpers';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let testDb: ReturnType<typeof createTestDb>['db'];
let testSqlite: ReturnType<typeof createTestDb>['sqlite'];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-for-ai-settings');
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

describe('GET /api/settings/ai', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns defaults when no settings exist', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { GET } = await import('../route');

    const res = await GET();
    const body = await res.json();
    expect(body.provider).toBeNull();
    expect(body.hasApiKey).toBe(false);
    expect(body.autoTagEnabled).toBe(false);
    expect(body.autoSummaryEnabled).toBe(false);
  });

  it('returns saved settings without exposing the API key', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));

    // First save some settings
    const { PUT, GET } = await import('../route');
    await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({
          provider: 'anthropic',
          apiKey: 'sk-ant-test-key',
          autoTagEnabled: true,
          autoSummaryEnabled: false,
        }),
      })
    );

    const res = await GET();
    const body = await res.json();
    expect(body.provider).toBe('anthropic');
    expect(body.hasApiKey).toBe(true);
    expect(body.autoTagEnabled).toBe(true);
    expect(body.autoSummaryEnabled).toBe(false);
    // API key should NOT be returned
    expect(body.apiKey).toBeUndefined();
    expect(body.apiKeyEncrypted).toBeUndefined();
  });
});

describe('PUT /api/settings/ai', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { PUT } = await import('../route');
    const res = await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({ provider: 'openai' }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('creates settings on first save', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { PUT } = await import('../route');

    const res = await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({
          provider: 'gemini',
          apiKey: 'AIzaSy-test',
          autoTagEnabled: true,
        }),
      })
    );

    expect(res.status).toBe(200);

    const rows = testDb
      .select()
      .from(schema.userAiSettings)
      .where(eq(schema.userAiSettings.userId, userId))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0].provider).toBe('gemini');
    expect(rows[0].apiKeyEncrypted).toBeTruthy();
    expect(rows[0].apiKeyEncrypted).not.toBe('AIzaSy-test'); // encrypted
    expect(rows[0].autoTagEnabled).toBe(1);
  });

  it('updates existing settings', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { PUT } = await import('../route');

    // First save
    await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({ provider: 'openai', apiKey: 'sk-test' }),
      })
    );

    // Update provider only
    await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({ provider: 'anthropic' }),
      })
    );

    const rows = testDb
      .select()
      .from(schema.userAiSettings)
      .where(eq(schema.userAiSettings.userId, userId))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0].provider).toBe('anthropic');
    // Key should still be there from first save
    expect(rows[0].apiKeyEncrypted).toBeTruthy();
  });

  it('clears API key when empty string passed', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { PUT } = await import('../route');

    await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({ provider: 'openai', apiKey: 'sk-test' }),
      })
    );

    await PUT(
      makeRequest('http://localhost:3000/api/settings/ai', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: '' }),
      })
    );

    const rows = testDb
      .select()
      .from(schema.userAiSettings)
      .where(eq(schema.userAiSettings.userId, userId))
      .all();
    expect(rows[0].apiKeyEncrypted).toBeNull();
  });
});
