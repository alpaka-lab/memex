import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { initFTS } from './fts';
import { createId } from '@paralleldrive/cuid2';

/**
 * Creates an in-memory SQLite database with the full schema and FTS5 for testing.
 */
export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');

  // Create tables matching the Drizzle schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      emailVerified INTEGER,
      image TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      token TEXT UNIQUE,
      expiresAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER,
      ipAddress TEXT,
      userAgent TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      accountId TEXT,
      providerId TEXT,
      accessToken TEXT,
      refreshToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      idToken TEXT,
      password TEXT,
      expiresAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT,
      value TEXT,
      expiresAt INTEGER,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      parentId TEXT REFERENCES collections(id),
      sortOrder INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      ogImage TEXT,
      favicon TEXT,
      domain TEXT,
      note TEXT,
      collectionId TEXT REFERENCES collections(id),
      isStarred INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );
    CREATE INDEX IF NOT EXISTS bookmarks_userId_createdAt_idx ON bookmarks(userId, createdAt);
    CREATE INDEX IF NOT EXISTS bookmarks_userId_isStarred_idx ON bookmarks(userId, isStarred);
    CREATE INDEX IF NOT EXISTS bookmarks_userId_collectionId_idx ON bookmarks(userId, collectionId);

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      color TEXT,
      createdAt INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tags_userId_name_idx ON tags(userId, name);

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmarkId TEXT NOT NULL REFERENCES bookmarks(id),
      tagId TEXT NOT NULL REFERENCES tags(id),
      PRIMARY KEY (bookmarkId, tagId)
    );
  `);

  // Init FTS5
  initFTS(sqlite);

  const db = drizzle(sqlite, { schema });

  return { sqlite, db };
}

const TEST_USER_ID = 'test-user-1';

export function seedTestUser(db: BetterSQLite3Database<typeof schema>, userId = TEST_USER_ID) {
  const now = new Date();
  db.insert(schema.users)
    .values({
      id: userId,
      email: `${userId}@test.com`,
      name: 'Test User',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return userId;
}

export function seedBookmark(
  db: BetterSQLite3Database<typeof schema>,
  userId: string,
  overrides: Partial<schema.NewBookmark> = {}
) {
  const now = new Date();
  const bookmark = {
    id: createId(),
    userId,
    url: `https://example.com/${createId()}`,
    title: 'Test Bookmark',
    description: 'A test bookmark',
    domain: 'example.com',
    isStarred: 0,
    isArchived: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  db.insert(schema.bookmarks).values(bookmark).run();
  return bookmark;
}

export function seedCollection(
  db: BetterSQLite3Database<typeof schema>,
  userId: string,
  overrides: Partial<schema.NewCollection> = {}
) {
  const now = new Date();
  const collection = {
    id: createId(),
    userId,
    name: 'Test Collection',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  db.insert(schema.collections).values(collection).run();
  return collection;
}

export function seedTag(
  db: BetterSQLite3Database<typeof schema>,
  userId: string,
  overrides: Partial<schema.NewTag> = {}
) {
  const now = new Date();
  const tag = {
    id: createId(),
    userId,
    name: `tag-${createId().slice(0, 6)}`,
    createdAt: now,
    ...overrides,
  };
  db.insert(schema.tags).values(tag).run();
  return tag;
}

export { TEST_USER_ID };
