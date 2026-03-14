import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedTestUser, seedCollection } from '@/lib/db/test-utils';
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

describe('GET /api/collections', () => {
  it('returns 401 when not authenticated', async () => {
    setMockSession(null);
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns collections for user', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    seedCollection(testDb, userId, { name: 'Work' });
    seedCollection(testDb, userId, { name: 'Personal' });
    const { GET } = await import('../route');

    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});

describe('POST /api/collections', () => {
  it('creates a collection', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const { POST } = await import('../route');

    const res = await POST(
      makeRequest('http://localhost:3000/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Collection', description: 'Test' }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('New Collection');
    expect(body.userId).toBe(userId);
  });
});

describe('PATCH /api/collections/:id', () => {
  it('updates a collection', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const col = seedCollection(testDb, userId, { name: 'Original' });
    const { PATCH } = await import('../[id]/route');

    const res = await PATCH(
      makeRequest(`http://localhost:3000/api/collections/${col.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      }),
      makeParams(col.id)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Updated');
  });

  it('returns 404 for wrong user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const col = seedCollection(testDb, otherUserId);
    const { PATCH } = await import('../[id]/route');

    const res = await PATCH(
      makeRequest(`http://localhost:3000/api/collections/${col.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hacked' }),
      }),
      makeParams(col.id)
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/collections/:id', () => {
  it('deletes a collection', async () => {
    const userId = seedTestUser(testDb);
    setMockSession(createMockSession(userId));
    const col = seedCollection(testDb, userId);
    const { DELETE } = await import('../[id]/route');

    const res = await DELETE(
      makeRequest(`http://localhost:3000/api/collections/${col.id}`),
      makeParams(col.id)
    );

    expect(res.status).toBe(200);
    const rows = testDb
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, col.id))
      .all();
    expect(rows).toHaveLength(0);
  });

  it('returns 404 for wrong user', async () => {
    const userId = seedTestUser(testDb, 'user-1');
    const otherUserId = seedTestUser(testDb, 'user-2');
    setMockSession(createMockSession(userId));
    const col = seedCollection(testDb, otherUserId);
    const { DELETE } = await import('../[id]/route');

    const res = await DELETE(
      makeRequest(`http://localhost:3000/api/collections/${col.id}`),
      makeParams(col.id)
    );
    expect(res.status).toBe(404);
  });
});
